const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractLinks(page) {
    return await page.evaluate(() => {
        var rawLinks =  Array.from(document.querySelectorAll('.art-list-item-title a'))
            //.filter(a => a.href.match(/.*\/article\/.*/))
            .map(link => link.href);
        var uniquesLinks = [...new Set(rawLinks)];
        return uniquesLinks;
    });
}

async function extractMeta(page) {
    return await page.evaluate(() => {
        let title = document.querySelector('.publication-title')? document.querySelector('.publication-title').innerText : "";
        let subtitle = document.querySelector('.publication-sub-title')? document.querySelector('.publication-sub-title').innerText : "";
        let eisbn = document.querySelector('#wd-book-online-isbn')? document.querySelector('#wd-book-online-isbn').innerText.replaceAll("Online ISBN: ","").replaceAll("Print ISBN: ","") : "";
        let isbn = document.querySelector('#wd-book-print-isbn')? document.querySelector('#wd-book-print-isbn').innerText.replaceAll("Online ISBN: ","").replaceAll("Print ISBN: ","") : "";
        return `${title};;${subtitle};;${isbn};;${eisbn}`;
    });
}

async function crawlPages(startUrl, page) {

    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });

    await page.waitForTimeout(4000);

    let currentPage = 1;

    const contentLinks = await extractLinks(page);
    const metaInfo = await extractMeta(page);
    
    // if (contentLinks.length === 0) {
    //     break; // нет ссылок, выход из цикла
    // }
    var currentPageUrl = page.url();
    fs.appendFileSync('found_links_iop_books.txt', contentLinks.join('\n') + '\n');
    console.log(`Links from Page ${currentPageUrl} have been saved to found_links.txt!`);

    fs.appendFileSync('found_links_iop_books_meta.txt', metaInfo + '\n');
    console.log(`Meta from Page ${currentPageUrl} have been saved to found_meta.txt!`);

    // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
    await page.waitForTimeout(3000);

    currentPage++;
}

async function main() {
    const sourceLinksPath = 'links_to_crawl.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({
        //args: ['--proxy-server=127.0.0.1:8118'],
        headless: false, //'new' for "true mode" and false for "debug mode (Browser open))"
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
      });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
    await browser.close();
}

main();