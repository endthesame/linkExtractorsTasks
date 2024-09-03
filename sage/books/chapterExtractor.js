const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const winston = require('winston');

puppeteer.use(StealthPlugin());
// Настройка логгера
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'crawler_chapters.log' })
    ]
});

async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks = Array.from(document.querySelectorAll('.chapter-list li a'))
            .map(elem => elem.href)
            //.filter(link => /n\d+\.xml$/.test(link));
        let links = [...new Set(rawLinks)];
        return links;
    });
}

async function crawlPages(startUrl, page) {
    try{
        await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });
    } catch {
        await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });
    }
    logger.info(`Processing main URL: ${startUrl}`);

    let currUrl = page.url();
    try{
        await page.waitForSelector('.k-content');
    } catch {
        await page.goto(currUrl, { waitUntil: 'networkidle0', timeout: 50000 });
    }
    var rawLinks = await extractLinks(page);
    const contentLinks = Array.from(new Set([...rawLinks]));
    fs.appendFileSync('raw_sage_chapters.txt', contentLinks.join('\n') + '\n');

    logger.info(`Links from Page ${currUrl}; links found: ${contentLinks.length}`);
    
    if (contentLinks.length === 0) {
        logger.warn(`No links found on page: ${currUrl}`);
    }
}

async function main() {
    const sourceLinksPath = 'sage_books.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    for (const sourceLink of sourceLinks) {
        logger.info(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }

    await browser.close();
}

main();
