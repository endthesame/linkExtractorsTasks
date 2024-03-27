const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks =  Array.from(document.querySelectorAll('.card-title a'))
            .map(elem => elem.href)
        let links = [...new Set(rawLinks)]
        return links;
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });
    await page.waitForTimeout(2000);

    //await page.goto(`https://karger.com/search-results?q=*&f_ContentType=Book+Chapter&fl_SiteID=1&page=${currentPage}`, { waitUntil: 'networkidle2', timeout: 120000 })
    var rawLinks = await extractLinks(page);
    const contentLinks = Array.from(new Set([...rawLinks]));
    let currUrl = page.url();
    fs.appendFileSync('found_links_bentham_chapters.txt', contentLinks.join('\n') + '\n');
    console.log(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);

}

async function main() {
    const sourceLinksPath = 'found_links_bentham_fullbooks.txt';
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