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
        new winston.transports.File({ filename: 'crawler.log' })
    ]
});

async function isNextButtonExist(page) {
    return await page.evaluate(() => {
        return document.querySelector('.next-btn button')? true : false;
    });
}

async function isNextButtonExist(page) {
    return await page.evaluate(() => {
        let rawLinks = Array.from(document.querySelectorAll('.text-md-md-lh a'))
            .map(elem => elem.href);
        let links = [...new Set(rawLinks)];
        return links;
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });
    logger.info(`Processing main URL: ${startUrl}`);

    while (true) {
        await page.waitForSelector('#result-list-start');
        var rawLinks = await isNextButtonExist(page);
        const contentLinks = Array.from(new Set([...rawLinks]));
        let currUrl = page.url();
        fs.appendFileSync('found_links_IEEE_conf_articles.txt', contentLinks.join('\n') + '\n');

        logger.info(`Links from Page ${currUrl}; links found: ${contentLinks.length}`);
        
        if (contentLinks.length === 0) {
            logger.warn(`No links found on page: ${currUrl}`);
        }

        try {
            //await page.waitForSelector('.pagination-bar');
            if (await isNextButtonExist(page)){
                await page.click('.next-btn button', { waitUntil: 'networkidle2', timeout: 50000 });
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
    const sourceLinksPath = 'links_to_extract.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    for (const sourceLink of sourceLinks) {
        logger.info(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }

    await browser.close();
}

main();
