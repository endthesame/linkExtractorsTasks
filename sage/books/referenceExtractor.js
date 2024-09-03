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
        new winston.transports.File({ filename: 'crawler_reference.log' })
    ]
});

async function isNextButtonExist(page) {
    return await page.evaluate(() => {
        return document.querySelector('#pager [title="Go to the next page"]')? true : false;
    });
}

async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks = Array.from(document.querySelectorAll('#divSearchResults .product-holder .text-holder h3 a'))
            .map(elem => elem.href);
        let links = [...new Set(rawLinks)];
        return links;
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });
    logger.info(`Processing main URL: ${startUrl}`);

    while (true) {
        let currUrl = page.url();
        try{
            await page.waitForSelector('#divSearchResults .product-holder');
        } catch {
            await page.goto(currUrl, { waitUntil: 'networkidle0', timeout: 50000 });
        }
        var rawLinks = await extractLinks(page);
        const contentLinks = Array.from(new Set([...rawLinks]));
        fs.appendFileSync('sage_reference_books.txt', contentLinks.join('\n') + '\n');

        logger.info(`Links from Page ${currUrl}; links found: ${contentLinks.length}`);
        
        if (contentLinks.length === 0) {
            logger.warn(`No links found on page: ${currUrl}`);
        }

        try {
            //await page.waitForSelector('.pagination-bar');
            if (await isNextButtonExist(page)){
                await page.click('#pager [title="Go to the next page"]', { waitUntil: 'networkidle2', timeout: 50000 });
                logger.info(`Clicked the next page button on URL: ${currUrl}`);
            } else {
                logger.info(`There is no pagination: ${currUrl}`);
            }
        } catch (error) {
            logger.error(`Failed to click the next page button on URL: ${currUrl}. Error: ${error.message}`);
            break;
        }
    }
}

async function main() {
    const sourceLinksPath = 'links_to_extract_reference.txt';
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
