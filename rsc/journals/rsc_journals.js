const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractLinks(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
            .filter(a => a.href.match(/.*content\/articlelanding.*/))
            .map(link => link.href);
    });
}

async function crawlPages(startUrl) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });

    await page.waitForTimeout(5000);

    let currentPage = 1;

    while (true) {
        const contentLinks = await extractLinks(page);

        fs.appendFileSync('found_links_rsc.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.paging__btn.paging__btn--next');
        if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true'))) {
            break; // кнопки нет, выход из цикла
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.paging__btn.paging__btn--next');
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            break; // если не удалось кликнуть, выход из цикла
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForTimeout(7000);

        currentPage++;
    }

    await browser.close();
}

async function main() {
    const sourceLinksPath = 'links_to_crawl_rsc_current.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink);
    }
}

main();