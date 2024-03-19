const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.item-info .sri-title a'))
            //.filter(a => a.href.match(/.*article\/.*searchresult.*$/))
            .map(link => link.href);
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });

    await page.waitForTimeout(10000);

    try{
        await page.click('.cmpboxbtn', { waitUntil: 'domcontentloaded', timeout: 50000 });
        console.log("cookie accept");
        await page.waitForTimeout(2000);
    } catch(error) {
        console.log("cookie no need to accept");
    }

    let currentPage = 6161;

    for(currentPage; currentPage < 19448; currentPage++) {
        let currentUrl = await page.url();
        //await page.goto(`https://karger.com/search-results?q=*&f_ContentType=Book+Chapter&fl_SiteID=1&page=${currentPage}`, { waitUntil: 'networkidle2', timeout: 120000 })
        var rawLinks = await extractLinks(page);
        const contentLinks = Array.from(new Set([...rawLinks]));

        fs.appendFileSync('found_links_karger_journals.txt', contentLinks.join('\n') + '\n');
        console.log(`Current Page ${currentUrl}`);
        console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);

        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.pagination-bottom-outer-wrap > div > .al-nav-next', { waitUntil: 'networkidle2', timeout: 50000 });
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 50000 })
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForTimeout(4000);
        //await page.waitForSelector('.pagination-bottom-outer-wrap');

    }

}

async function main() {
    const sourceLinksPath = 'links_to_crawl.txt';
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