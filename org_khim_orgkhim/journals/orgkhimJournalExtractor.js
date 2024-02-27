const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractLinks(page) {
    return await page.evaluate(() => {
        var rawLinks =  Array.from(document.querySelectorAll('.title a'))
            .map(link => link.href);
        var uniqueLinks = [...new Set(rawLinks)];
        return uniqueLinks;
    });
}

async function crawlPages(startUrl) {
    const browser = await puppeteer.launch({ headless:'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1400,
        height: 800,
        deviceScaleFactor: 1,
      });
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });

    await page.waitForTimeout(3000);

    let currentPage = 1;

    const contentLinks = await extractLinks(page);

    fs.appendFileSync('found_links_orgkhim_journals.txt', contentLinks.join('\n') + '\n');
    console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);

    // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)

    currentPage++;


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