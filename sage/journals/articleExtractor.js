const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks =  Array.from(document.querySelectorAll('.issue-item__title a'))
            .map(elem => elem.href)
        let links = [...new Set(rawLinks)]
        return links;
    });
}

async function isCookieAcceptNeeded(page) {
    return await page.evaluate(() => {
        let cookie = document.querySelector('.qc-cmp2-summary-buttons')
        if (cookie){
            return true
        } else {
            return false
        }
    });
}


async function isNextButtonExist(page) {
    return await page.evaluate(() => {
        let next_button = document.querySelector('.content-navigation__btn--pre')
        let isNextButtonEnable = document.querySelector('.content-navigation__btn--pre[disabled="true"]')? false : true;
        if (next_button && isNextButtonEnable){
            return true
        } else {
            return false
        }
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });
    await page.waitForTimeout(5000);
    if (await isCookieAcceptNeeded(page)){
        try {
            await page.click('.qc-cmp2-summary-buttons button[mode="primary"]', { waitUntil: 'networkidle2', timeout: 50000 });
        } catch (error) {
            console.log("cannot accept cookie")
        }
    }

    try {
        await page.click('a[data-id="view-current-issue"]', { waitUntil: 'networkidle2', timeout: 50000 })
    } catch (error) {
        console.log("cant click current issue - BREAK THIS LINK")
        return;
    }
    

    let currentPage = 1;

    while (true) {
        var rawLinks = await extractLinks(page);
        const contentLinks = Array.from(new Set([...rawLinks]));
        let currUrl = page.url();
        fs.appendFileSync('articles_links.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
        await page.waitForTimeout(1000)
        try {
            await page.waitForSelector('.content-navigation__btn--pre');
            if (await isNextButtonExist(page)){
                await page.click('.content-navigation__btn--pre', { waitUntil: 'networkidle2', timeout: 50000 });
                await page.waitForTimeout(2000)
            } else {
                console.log("no prev button");
                break;
            }
        } catch (error) {
            console.log(`Failed to click the prev page button. Error: ${error.message}`);
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 })
        }
    }

}

async function main() {
    const sourceLinksPath = 'journals_links.txt';
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