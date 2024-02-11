const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
            .filter(a => a.href.match(/\/conference-proceedings-of-spie\/.*$/))
            .map(link => link.href);
    });
}

async function extractTitle(page) {
    return await page.evaluate(() => {
        return document.querySelector('.ProceedingsArticleOpenAccessHeaderText')? document.querySelector('.ProceedingsArticleOpenAccessHeaderText').innerText : null;
    });
}


async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    //await page.waitForNavigation({waitUntil: 'networkidle0'})
    await page.waitForTimeout(1000);

    let currentPage = 0;
    var rawLinks = await extractLinks(page);
    const contentLinks = Array.from(new Set([...rawLinks]));

    fs.appendFileSync('found_links_spie_conf.txt', contentLinks.join('\n') + '\n');
    console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);
    var result = await extractTitle(page);
    return result

}

async function main() {
    const sourceLinksPath = 'links_to_crawl_spie_conf.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    var browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    var page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        var result = await crawlPages(sourceLink, page);
        if (!result){
            await browser.close();
            browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            page = await browser.newPage();
        }
    }
    await browser.close();
}

main();