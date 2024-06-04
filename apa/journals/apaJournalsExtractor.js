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
    console.log(logMessage)
}

async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks = Array.from(document.querySelectorAll('a.article-title')).map(elem => elem.href);
        let links = [...new Set(rawLinks)];
        return links;
    });
}

// async function extractMetaJournal(page) {
//     return await page.evaluate(() => {
//         let journalName = document.querySelector('journalactionbar h2')? document.querySelector('journalactionbar h2').innerText : "unknown";
//         return links;
//     });
// }

async function openVolumes(page) {
    return await page.evaluate(() => {
        let buttonsToClick = Array.from(document.querySelectorAll('a.volume-link'))
        buttonsToClick.map(elem => elem.click());  
    });
}

async function extractIssueLinks(page) {
    return await page.evaluate(() => {
        let rawLinks = Array.from(document.querySelectorAll('.issue-item a')).map(elem => elem.href);
        let links = [...new Set(rawLinks)];
        return links;
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 80000 });
    await page.waitForTimeout(12000);
    let currUrl = page.url();
    await page.waitForTimeout(1000);
    let rawLinks = await extractIssueLinks(page);
    await openVolumes(page);
    await page.waitForTimeout(3000);
    rawLinks = [...rawLinks, ...await extractIssueLinks(page)];
    const contentLinks = Array.from(new Set([...rawLinks]));
    fs.appendFileSync('issues_links.txt', contentLinks.join('\n') + '\n');
    logToFile(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
}


async function crawlIssuesPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 80000 });
    let currUrl = page.url();
    try {
        await page.waitForSelector('a.article-title');
    } catch (error) {
        logToFile(`Links from Page ${currUrl} not loaded`);
    }
    var rawLinks = await extractLinks(page);
    const contentLinks = Array.from(new Set([...rawLinks]));
    if (contentLinks.length < 1 && !await page.$("journalrecordlist")) {
        await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 80000 });
    }
    fs.appendFileSync('articles_links.txt', contentLinks.join('\n') + '\n');
    logToFile(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
}

async function main() {
    logToFile("CRAWLING JOURNALS BEGIN:\n");
    const sourceLinksPath = 'journals_links.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    for (const sourceLink of sourceLinks) {
        logToFile(`Crawling pages for journal link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
    logToFile("CRAWLING ISSUES BEGIN:\n");
    const sourceLinksPathIssues = 'issues_links.txt';
    const sourceLinksIssues = fs.readFileSync(sourceLinksPathIssues, 'utf-8').split('\n').filter(Boolean);
    for (const sourceLink of sourceLinksIssues) {
        logToFile(`Crawling pages for issue link: ${sourceLink}`);
        await crawlIssuesPages(sourceLink, page);
    }
    await browser.close();
}

main();
