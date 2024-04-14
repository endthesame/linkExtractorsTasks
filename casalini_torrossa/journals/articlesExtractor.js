const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.uk-first-column .border-padding a'))
            .map(link => link.href);
    });
}

async function clickNext(page) {
    return await page.evaluate(() => {
        let nextButtonsArray = Array.from(document.querySelectorAll('.page-link')).filter(elem => elem.innerText.includes("Next"))
        if (nextButtonsArray.length > 0){
            let nextButton = nextButtonsArray[0];
            nextButton.click();
            return true;
        }
        else{
            return false;
        }
    });
}

async function nextUrl(page) {
    return await page.evaluate(() => {
        let nextButtonsArray = Array.from(document.querySelectorAll('.page-link')).filter(elem => elem.innerText.includes("Next"))
        if (nextButtonsArray.length > 0){
            let nextButton = nextButtonsArray[0].href;
            return nextButton
        }
        else{
            return "";
        }
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });

    await page.waitForTimeout(15000);

    let currentPage = 1;

    //await page.goto(`https://karger.com/search-results?q=*&f_ContentType=Book+Chapter&fl_SiteID=1&page=${currentPage}`, { waitUntil: 'networkidle2', timeout: 120000 })
    while (true){
        var rawLinks = await extractLinks(page);
        const contentLinks = Array.from(new Set([...rawLinks]));
        let currUrl = page.url();
        fs.appendFileSync('found_links_torrossa_journals.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
        try {
            if(await clickNext(page)){
                console.log("clicked");
            }else {
                return false;
            }
            // nextPageUrl = await nextUrl(page);
            // if (nextPageUrl != ""){
            //     await page.goto(nextPageUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });
            // } else {
            //     return false;
            // }


            // await page.waitForSelector('.book_link');
            // // Попытка клика на кнопку paging__btn--next
            // await page.click('.pagination-bottom-outer-wrap > div > .al-nav-next', { waitUntil: 'networkidle2', timeout: 50000 });
            
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 })
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForSelector('.uk-article')
        await page.waitForTimeout(4000);
    }

}

async function main() {
    const sourceLinksPath = 'links_to_crawl_articles.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
    await browser.close();
}

main();