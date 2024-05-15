const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractIssueLinks(page) {
    return await page.evaluate(() => {
        let rawLinks =  Array.from(document.querySelectorAll('.volume-issue-link'))
            .map(elem => elem.href)
        let links = [...new Set(rawLinks)]
        return links;
    });
}

async function extractArticlesLinks(page) {
    return await page.evaluate(() => {
        let rawLinks =  Array.from(document.querySelectorAll('.article-list-item'))
            .map(elem => elem.href)
        let links = [...new Set(rawLinks)]
        return links;
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });
    let currUrl = page.url();
    let issueLinks = await extractIssueLinks(page);
    for (let i=0; i < issueLinks.length; i++){
        await page.goto(issueLinks[i], { waitUntil: 'networkidle2', timeout: 50000 });
        currUrl = page.url();
        let articlesLinks = await extractArticlesLinks(page);
        fs.appendFileSync('Jfound_links_TSFP.txt', articlesLinks.join('\n') + '\n');
        console.log(`Links from Page ${currUrl}; links length: ${articlesLinks.length}`);

    }
}

async function main() {
    const sourceLinksPath = 'links_to_crawl_ref_journals_articles.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
    await browser.close();
}

main();