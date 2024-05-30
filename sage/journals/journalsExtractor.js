const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks =  Array.from(document.querySelectorAll('.search__item a'))
            .map(elem => elem.href)
        let links = [...new Set(rawLinks)]
        return links;
    });
}

async function isNextButtonExist(page) {
    return await page.evaluate(() => {
        let next_button = document.querySelector('.page-item__arrow--next')
        if (!next_button.classList.contains('disabled')){
            return true
        } else {
            return false
        }
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });

    //await page.waitForTimeout(15000);

    // try{
    //     await page.click('.cmpboxbtn', { waitUntil: 'domcontentloaded', timeout: 50000 });
    //     console.log("cookie accept");
    //     await page.waitForTimeout(2000);
    // } catch(error) {
    //     console.log("cookie no need to accept");
    // }

    let currentPage = 1;

    while (true) {
        var rawLinks = await extractLinks(page);
        const contentLinks = Array.from(new Set([...rawLinks]));
        let currUrl = page.url();
        fs.appendFileSync('journals_links.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
        try {
            await page.waitForSelector('.pagination__nav');
            // Попытка клика на кнопку paging__btn--next
            //let next_button = await page.$('.page-item__arrow--next')
            if (await isNextButtonExist(page)){
                await page.click('.page-item__arrow--next', { waitUntil: 'networkidle2', timeout: 50000 });
            } else {
                console.log("no next button");
                break;
            }
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 })
        }
        await page.waitForTimeout(4000);

    }

}

async function main() {
    const sourceLinksPath = 'start_link.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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