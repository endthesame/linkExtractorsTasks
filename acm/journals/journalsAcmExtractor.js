const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractLinks(page) {
    return await page.evaluate(() => {
        var rawLinks = Array.from(document.querySelectorAll('.issue-item__title a'))
            .map(link => link.href);
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

    let currentPage = 1;

    while (true) {
        let currUrl = page.url();
        let contentLinks = await extractLinks(page);
        
        if (contentLinks.length === 0) {
            await page.goto(currUrl, { waitUntil: 'networkidle0', timeout: 50000 });
            console.log("0 links: restart url") // нет ссылок
            contentLinks = await extractLinks(page);
        }

        fs.appendFileSync('found_links_acm_journals.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currentPage} and url: ${currUrl}: count: ${contentLinks.length}`);

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.content-navigation__btn--pre');
        const nextPageButtonDisabled = await page.$('.content-navigation__btn--disabled');
        if (!nextPageButton) {
            break; // кнопки нет, выход из цикла
        }

        if (nextPageButtonDisabled){
            if ((await nextPageButtonDisabled.evaluate(button => button.getAttribute('title') === 'Previous:'))){
                break;
            }
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.content-navigation__btn--pre');
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
    const sourceLinksPath = 'links_to_crawl.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink);
    }
}

main();
