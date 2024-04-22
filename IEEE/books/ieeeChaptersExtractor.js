const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks =  Array.from(document.querySelectorAll('.select-list__list .text-base-md-lh'))
            .map(elem => elem.href)
            //.filter(link => link.includes("/book/"))
        let links = [...new Set(rawLinks)]
        return links;
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });
    //await page.waitForSelector('.text-md-md-lh')
    var rawLinks = await extractLinks(page);
    const contentLinks = Array.from(new Set([...rawLinks]));
    let currUrl = page.url();
    fs.appendFileSync('found_links_IEEE_chapters.txt', contentLinks.join('\n') + '\n');
    console.log(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);

}

async function main() {
    const sourceLinksPath = 'found_links_IEEE_fullbooks.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
    await browser.close();
}

main();