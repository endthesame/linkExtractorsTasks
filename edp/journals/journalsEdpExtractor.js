const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks = Array.from(document.querySelectorAll('.article_title'))
            .map(link => link.href);
        let uniquesLinks = [...new Set(rawLinks)];
        return uniquesLinks;
    });
}

async function crawlPages(startUrl) {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1400,
        height: 800,
        deviceScaleFactor: 1,
      });
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });

    await page.waitForTimeout(5000);

    let currentPage = 1;

    while (true) {
        await page.waitForSelector("#toc");
        const contentLinks = await extractLinks(page);

        fs.appendFileSync('found_links_edp_journals.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.toc-nav-back a');
        if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true'))) {
            break; // кнопки нет, выход из цикла
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.toc-nav-back a', { waitUntil: 'domcontentloaded', timeout: 50000 });
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            break; // если не удалось кликнуть, выход из цикла
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForTimeout(5000);

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