const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractLinks(page) {
    return await page.evaluate(() => {
        var rawLinks =  Array.from(document.querySelectorAll('.chapter_link'))
            .map(link => link.href);
        var uniqueLinks = [...new Set(rawLinks)];
        return uniqueLinks;
    });
}

async function crawlPages(startUrl) {
    const browser = await puppeteer.launch({ headless:false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1400,
        height: 800,
        deviceScaleFactor: 1,
      });
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });

    await page.waitForTimeout(3000);

    let currentPage = 1;

    while (true) {
        let currUrl = page.url();
        const contentLinks = await extractLinks(page);

        fs.appendFileSync('found_links_duke_chapters_24_03.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currUrl} crawled; links count: ${contentLinks.length}`);

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.pagination-bottom-outer-wrap .sr-nav-next');
        if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true'))) {
            break; // кнопки нет, выход из цикла
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.pagination-bottom-outer-wrap .sr-nav-next', { waitUntil: 'networkidle2', timeout: 50000 });
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            break; // если не удалось кликнуть, выход из цикла
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForTimeout(4000);

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