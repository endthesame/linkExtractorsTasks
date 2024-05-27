const puppeteer = require('puppeteer');
const fs = require('fs');

const sitemapsFilePath = 'links_to_sitemaps.txt';
const articleLinksFilePath = 'sage_article_links.txt';
const stateFilePath = 'sage_crawler_state.json';

async function fetchHTML(browser, url) {
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 15000));

        const content = await page.content();
        await page.close();
        return content;
    } catch (error) {
        console.error(`Error fetching content from ${url}: ${error.message}`);
    } finally {
        await page.close();
    }
    return null;
}

async function extractArticleLinks(browser, url) {
    try {
        console.log(`Fetching HTML from: ${url}`);
        const htmlData = await fetchHTML(browser, url);
        if (!htmlData) {
            console.log(`No content found at: ${url}`);
            return;
        }
        const links = await parseHTMLForLinks(htmlData);

        links.forEach(link => {
            if (link.includes('/abs/')) {
                console.log(`Found article link: ${link}`);
                fs.appendFileSync(articleLinksFilePath, link + '\n');
            }
        });
    } catch (error) {
        console.error(`Error processing manifest link ${url}: ${error.message}`);
        throw error;
    }
}

async function parseHTMLForLinks(html) {
    const links = [];
    const regex = /<span>(https:\/\/journals\.sagepub\.com\/doi\/abs\/[^<]+)<\/span>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        links.push(match[1]);
    }
    return links;
}

function saveState(state) {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

function loadState() {
    if (fs.existsSync(stateFilePath)) {
        const stateData = fs.readFileSync(stateFilePath, 'utf-8');
        return JSON.parse(stateData);
    }
    return { lastProcessedSitemapLink: null };
}

async function processSitemapLinks(browser, sitemapLinks, state) {
    let sitemapProcessed = false;
    for (const sitemapLink of sitemapLinks) {
        if (!state.lastProcessedSitemapLink || sitemapProcessed || state.lastProcessedSitemapLink === sitemapLink) {
            state.lastProcessedSitemapLink = null; // Reset sitemap state once processed
            sitemapProcessed = true;
            console.log(`Processing sitemap link: ${sitemapLink}`);
            try {
                await extractArticleLinks(browser, sitemapLink);
                state.lastProcessedSitemapLink = sitemapLink;
                saveState(state);
            } catch (error) {
                console.error(`Error processing sitemap link ${sitemapLink}: ${error.message}`);
                saveState(state);
                break;
            }
        }
    }
    state.lastProcessedSitemapLink = null; // Reset sitemap state after all sitemaps are processed
}

async function main() {
    const sitemapLinks = fs.readFileSync(sitemapsFilePath, 'utf-8').split('\n').filter(Boolean);
    const state = loadState();

    const browser = await puppeteer.launch({ headless: false });

    await processSitemapLinks(browser, sitemapLinks, state);

    await browser.close();

    console.log('Article links have been saved to sage_article_links.txt');
}

main().catch(console.error);
