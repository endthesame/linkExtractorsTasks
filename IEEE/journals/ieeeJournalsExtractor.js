const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealhPlugin());

const logFilePath = path.join(__dirname, 'crawler.log');

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
}

async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks = Array.from(document.querySelectorAll('.result-item h2 a')).map(elem => elem.href);
        let links = [...new Set(rawLinks)];
        return links;
    });
}

async function getDecadeArr(page) {
    const decadeElements = await page.$$('.row .issue-details-past-tabs');
    if (decadeElements.length === 2) {
        const firstDecadeElement = await decadeElements[0].$$('li');
        return firstDecadeElement;
    }
    return [];
}

async function extractIssueLinks(page) {
    await page.waitForSelector('.row .issue-list', { waitUntil: 'networkidle2', timeout: 50000 });
    await page.waitForTimeout(3000);
    var decade = await getDecadeArr(page);
    let links = [];
    if (decade.length > 0) {
        for (let j = 0; j < decade.length; j++) {
            await decade[j].click();
            await page.waitForTimeout(1000);
            let yearArr = await page.$$('.row .year li');
            for (let i = 0; i < yearArr.length; i++) {
                const hasHref = await page.evaluate(element => element.querySelector('a') ? element.querySelector('a').hasAttribute('href') : false, yearArr[i]);
                if (hasHref) {
                    links.push(await yearArr[i].$eval('a', a => a.href));
                } else {
                    await yearArr[i].click();
                    await page.waitForTimeout(1000);
                    const rawLinks = await page.$$eval('.row .issue-list a', links => links.map(elem => elem.href));
                    links.push(...rawLinks);
                }
            }
        }
    } else {
        let yearArr = await page.$$('.row .year li');
        for (let i = 0; i < yearArr.length; i++) {
            const hasHref = await page.evaluate(element => element.querySelector('a') ? element.querySelector('a').hasAttribute('href') : false, yearArr[i]);
            if (hasHref) {
                links.push(await yearArr[i].$eval('a', a => a.href));
            } else {
                await yearArr[i].click();
                await page.waitForTimeout(1000);
                const rawLinks = await page.$$eval('.row .issue-list a', links => links.map(elem => elem.href));
                links.push(...rawLinks);
            }
        }
    }
    links = Array.from(new Set(links));
    return links;
}

async function extractVolumeLinks(page) {
    return await page.evaluate(() => {
        let rawLinks = Array.from(document.querySelectorAll('.issue-details-past-tabs li a')).map(elem => elem.href);
        let links = [...new Set(rawLinks)];
        return links;
    });
}

async function choosePage(page, issue_button, volume_button) {
    let links = [];
    if (issue_button) {
        await issue_button.click({ waitUntil: 'networkidle2', timeout: 80000 });
        await page.waitForTimeout(1000);
        links = [...links, ...await extractIssueLinks(page)];
    } else if (volume_button) {
        await volume_button.click({ waitUntil: 'networkidle2', timeout: 80000 });
        await page.waitForTimeout(1000);
        links = [...links, ...await extractVolumeLinks(page)];
    } else {
        logToFile("NO PAGINATION BUTTON");
    }
    return links;
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 80000 });
    let currUrl = page.url();
    await page.waitForTimeout(1000);
    const all_issue_button = await page.$('.stats-jhp-AllIssues');
    const all_volume_button = await page.$('.stats-jhp-AllVolumes');
    await page.waitForTimeout(1000);
    let rawLinks = await choosePage(page, all_issue_button, all_volume_button);

    const contentLinks = Array.from(new Set([...rawLinks]));
    fs.appendFileSync('found_links_IEEE_issues.txt', contentLinks.join('\n') + '\n');
    logToFile(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
}

async function getArticleCount(page) {
    return await page.evaluate(() => {
        return document.querySelector('span.strong:nth-child(2)')? document.querySelector('span.strong:nth-child(2)').innerText.trim() : "";
})};

async function crawlIssuesPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 80000 });
    let links_count = await getArticleCount(page);
    logToFile(`links_count: ${links_count.length}`);
    if (links_count.length > 5) {
        logToFile(`links_count > 5: ${links_count.length}`);
        return;
    }
    while (true) {
        let currUrl = page.url();
        try {
            await page.waitForSelector('.text-md-md-lh');
        } catch (error){
            try {
                await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 80000 });
                await page.waitForSelector('.text-md-md-lh');
            } catch (error) {
                logToFile(`PAGE NOT LOADED`);
            }
        }
        var rawLinks = await extractLinks(page);
        const contentLinks = Array.from(new Set([...rawLinks]));
        if (contentLinks.length < 1 && !await page.$(".col .List-results-items")) {
            await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 80000 });
        }
        fs.appendFileSync('found_links_IEEE_articles.txt', contentLinks.join('\n') + '\n');
        logToFile(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
        try {
            if (await page.$(".col .pagination-bar")){
                await page.waitForSelector('.col .pagination-bar');
                await page.click('.next-btn button', { waitUntil: 'networkidle2', timeout: 80000 });
            }
            else {
                logToFile(`NO PAGINATION`);
                break;
            }
        } catch (error) {
            logToFile(`Failed to click the next page button. Error: ${error.message}`);
            break;
        }
    }
}

async function main() {
    logToFile("CRAWLING JOURNALS BEGIN:\n");
    const sourceLinksPath = 'links_to_crawl.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    for (const sourceLink of sourceLinks) {
        logToFile(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
    logToFile("CRAWLING ISSUES BEGIN:\n");
    const sourceLinksPathIssues = 'found_links_IEEE_issues.txt';
    const sourceLinksIssues = fs.readFileSync(sourceLinksPathIssues, 'utf-8').split('\n').filter(Boolean);
    for (const sourceLink of sourceLinksIssues) {
        logToFile(`Crawling pages for source link: ${sourceLink}`);
        await crawlIssuesPages(sourceLink, page);
    }
    await browser.close();
}

main();
