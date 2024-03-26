const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.book_link'))
            .map(link => link.href.replace('?searchresult=1',''));
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });

    await page.waitForTimeout(15000);

    try{
        await page.click('.cmpboxbtn', { waitUntil: 'domcontentloaded', timeout: 50000 });
        console.log("cookie accept");
        await page.waitForTimeout(2000);
    } catch(error) {
        console.log("cookie no need to accept");
    }

    let currentPage = 1;

    for(currentPage; currentPage < 350; currentPage++) {
        //await page.goto(`https://karger.com/search-results?q=*&f_ContentType=Book+Chapter&fl_SiteID=1&page=${currentPage}`, { waitUntil: 'networkidle2', timeout: 120000 })
        var rawLinks = await extractLinks(page);
        const contentLinks = Array.from(new Set([...rawLinks]));
        let currUrl = page.url();
        fs.appendFileSync('found_links_karger_fullbooks.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
        try {
            await page.waitForSelector('.book_link');
            // Попытка клика на кнопку paging__btn--next
            await page.click('.pagination-bottom-outer-wrap > div > .al-nav-next', { waitUntil: 'networkidle2', timeout: 50000 });
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 })
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForSelector('#ContentColumn');
        await page.waitForTimeout(4000);

    }

}

async function main() {
    const sourceLinksPath = 'links_to_crawl_fullbooks.txt';
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