const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.issue-item__title a'))
            //.filter(a => a.href.match(/.*doi\/abs.*$/))
            .map(link => link.href);
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });

    await page.waitForTimeout(5000);

    let currentPage = 1;

    while (true) {
        // await page.waitForNavigation({
        //     waitUntil: 'networkidle0', 
        //     timeout: 50000
        //   });
        const contentLinks = await extractLinks(page);
        
        // if (contentLinks.length === 0) {
        //     break; // нет ссылок, выход из цикла
        // }
        const coockiesAcceptButton = await page.$('#onetrust-accept-btn-handler');
        if (coockiesAcceptButton) {
            await coockiesAcceptButton.click();
            await page.waitForTimeout(2000);
        }

        fs.appendFileSync('found_links.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.content-navigation__btn--pre');
        if (!nextPageButton) {
            break; // кнопки нет, выход из цикла
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.content-navigation__btn--pre');
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            break; // если не удалось кликнуть, выход из цикла
        }
        // const articlesButtons = await page.$$('.issue-item__title > a');
        // for (const button of articlesButtons) {
        //     await button.click();
        //     // Выполните нужные действия после клика, например, дождитесь загрузки следующей страницы или выполните другие манипуляции

        //     await page.waitForTimeout(4000);
        //     await page.goBack();
        //     // Убираем обработанную ссылку из файла
        // }

        // // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForTimeout(4000);

        currentPage++;
    }

}

async function main() {
    const sourceLinksPath = 'links_to_crawl.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
    await browser.close();
}

main();