const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractLinks(page) {
    return await page.evaluate(() => {
        var rawLinks = Array.from(document.querySelectorAll('.issue-item__title a'))
            .map(link => link.href)
        if (rawLinks.length === 0){
            rawLinks =  Array.from(document.querySelectorAll('.chapter-heading a'))
            .map(link => link.href);
        }
        var uniqueLinks = [...new Set(rawLinks)];
        return uniqueLinks;
    });
}

async function crawlPages(startUrl) {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900 });
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });

    await page.waitForTimeout(5000);

    const contentLinks = await extractLinks(page);
    var currentUrl = page.url();
    fs.appendFileSync('found_links_acm_own_books.txt', contentLinks.join('\n') + '\n');
    console.log(`Links from Page ${currentUrl} have been saved to found_links.txt!`);

    await browser.close();
}

async function main() {
    const sourceLinksPath = 'links_to_crawl.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink);
    }
}

main();
