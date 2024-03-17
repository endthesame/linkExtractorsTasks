const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealhPlugin());

async function extractLinks(page) {
    return await page.evaluate(() => {
        var rawLinks =  Array.from(document.querySelectorAll('.at-articleLink'))
            .map(link => link.href);
        var uniquesLinks = [...new Set(rawLinks)];
        return uniquesLinks;
    });
}

async function isLastIssuePage(page) {
    return await page.evaluate(() => {
        let endPage = false;
        let listOfPrevClasses = Array.from(document.querySelector(".issue-link--prev ").classList).map(elem => {
            if (elem == "invisible"){
                endPage = true;
            }
        })
        return endPage;
    });
}

async function getLatestIssueLink(page) {
    return await page.evaluate(() => {
        let latestIssue = document.querySelector('.currentIssue .widget-IssueInfo__link')? document.querySelector('.currentIssue .widget-IssueInfo__link').href : "";
        return latestIssue;
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
        width: 1400,
        height: 800,
        deviceScaleFactor: 1,
      });
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });

    await page.waitForTimeout(10000);
    
    let latestIssue = await getLatestIssueLink(page);
    if (latestIssue == ""){
        let currentPageUrl = await page.url();
        fs.appendFileSync('no_links_journals.txt', currentPageUrl + '\n');
        console.log(`Links from Page ${currentPageUrl} have been saved to found_links.txt!`);
        //return;
    } else {
        await page.goto(latestIssue, { waitUntil: 'networkidle0', timeout: 50000 });
    }

    let currentPage = 1;

    while (true) {
        const contentLinks = await extractLinks(page);
        
        // if (contentLinks.length === 0) {
        //     break; // нет ссылок, выход из цикла
        // }
        let currentPageUrl = await page.url();
        fs.appendFileSync('found_links_oxford_journals.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currentPageUrl} have been saved to found_links.txt!`);

        let isLastPage = await isLastIssuePage(page)
        if (isLastPage){
            break;
        }

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.issue-link--prev ');
        if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true'))) {
            break; // кнопки нет, выход из цикла
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.issue-link--prev ', { waitUntil: 'networkidle0' });
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            break; // если не удалось кликнуть, выход из цикла
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForTimeout(3000);

        currentPage++;
    }

    await browser.close();
}

async function main() {
    const sourceLinksPath = 'links_to_journals_current.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink);
    }
}

main();