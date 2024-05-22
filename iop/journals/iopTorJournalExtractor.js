const puppeteer = require('puppeteer');
const fs = require('fs');
const { execSync } = require('child_process');

// Функция для смены IP через Tor
function changeTorIP() {
    try {
        execSync('python change_ip.py');
        console.log('IP changed successfully');
    } catch (error) {
        console.error(`Failed to change IP. Error: ${error.message}`);
    }
}

// Функция для логирования
function log(message) {
    const logMessage = `${new Date().toISOString()} - ${message}\n`;
    fs.appendFileSync('crawler.log', logMessage);
}

async function extractLinks(page) {
    try {
        return await page.evaluate(() => {
            var rawLinks = Array.from(document.querySelectorAll('.art-list-item-title'))
                .map(link => link.href);
            var uniqueLinks = [...new Set(rawLinks)];
            return uniqueLinks;
        });
    } catch (error) {
        log(`Error extracting links: ${error.message}`);
        return [];
    }
}

async function crawlPages(startUrl, previousPageUrl = null) {
    let browser, page;

    try {
        browser = await puppeteer.launch({
            headless: false, // 'new' for "true mode" and false for "debug mode (Browser open)"
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--proxy-server=127.0.0.1:8118']
        });

        page = await browser.newPage();
        await page.setViewport({
            width: 1280,
            height: 720,
            deviceScaleFactor: 1,
        });

        // Если передан URL предыдущей страницы, открываем его, иначе начальный URL
        const targetUrl = previousPageUrl || startUrl;
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });

        if (!previousPageUrl) {
            try {
                await page.click('#latestVolumeIssues');
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
            } catch (error) {
                log(`Failed to click the volume button. Error: ${error.message}`);
            }
        }

        while (true) {
            // Проверка наличия селектора #wd-pub-name
            const pubNameExists = await page.$('#wd-pub-name');
            if (!pubNameExists) {
                log(`Selector #wd-pub-name not found on page ${page.url()}. Changing IP.`);
                await browser.close();
                changeTorIP();
                return crawlPages(startUrl, page.url());
            }

            const contentLinks = await extractLinks(page);
            const currentPageUrl = page.url();
            fs.appendFileSync('found_links_iop_journals2.txt', contentLinks.join('\n') + '\n');
            log(`Links from Page ${currentPageUrl} have been saved! Total links: ${contentLinks.length}`);

            const nextPageButton = await page.$('.mr-1');
            if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true'))) {
                break; // кнопки нет, выход из цикла
            }

            try {
                await Promise.all([
                    page.click('.mr-1'),
                    page.waitForNavigation({ waitUntil: 'networkidle2' })
                ]);
            } catch (error) {
                log(`Failed to click the next page button. Error: ${error.message}`);
                break; // если не удалось кликнуть, выход из цикла
            }
        }
    } catch (error) {
        log(`Error during crawling: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function main() {
    const sourceLinksPath = 'links_to_crawl.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);

    for (const sourceLink of sourceLinks) {
        log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink);
    }
}

main();
