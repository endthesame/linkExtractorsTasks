const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());

async function extractLinks(page) {
    return await page.evaluate(() => {
        var rawLinks =  Array.from(document.querySelectorAll('.art-list-item-title'))
            //.filter(a => a.href.match(/.*\/article\/.*/))
            .map(link => link.href);
        var uniquesLinks = [...new Set(rawLinks)];
        return uniquesLinks;
    });
}

async function crawlPages(startUrl) {
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
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });

    await new Promise(resolve => setTimeout(resolve, 25000));

    try{
        await page.click('#latestVolumeIssues', { waitUntil: 'networkidle2' });
    } catch (error) {
        console.log(`Failed to click the volume button. Error: ${error.message}`);
    }

    let currentPage = 1;

    while (true) {
        const contentLinks = await extractLinks(page);
        
        // if (contentLinks.length === 0) {
        //     break; // нет ссылок, выход из цикла
        // }
        var currentPageUrl = page.url();
        fs.appendFileSync('found_links_iop_journals.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currentPageUrl} have been saved! Total links: ${contentLinks.length}`);

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.mr-1');
        if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true'))) {
            break; // кнопки нет, выход из цикла
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.mr-1', { waitUntil: 'networkidle2' });
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            break; // если не удалось кликнуть, выход из цикла
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        //await page.waitForTimeout(4000);

        currentPage++;
    }

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