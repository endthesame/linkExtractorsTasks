const puppeteer = require('puppeteer-extra');
const StealhPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');


puppeteer.use(StealhPlugin());
async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawLinks =  Array.from(document.querySelectorAll('.result-item h2 a'))
            .map(elem => elem.href)
        let links = [...new Set(rawLinks)]
        return links;
    });
}

async function getArticleCount(page) {
    return await page.evaluate(() => {
        return document.querySelector('span.strong:nth-child(2)')? document.querySelector('span.strong:nth-child(2)').innerText.trim() : "";
    });
}

// async function extractIssueLinks(page) {
//     return await page.evaluate(() => {
//         let links = []
//         let yearArr = Array.from(document.querySelectorAll('.row .year li'))
//         for (let i =0; i < yearArr.length; i++){
//             new Promise(resolve => setTimeout(resolve, 3000));
//             yearArr[i].click();
//             let rawLinks =  Array.from(document.querySelectorAll('.row .issue-list a'))
//                 .map(elem => elem.href)
//             links = [...links,...new Set(rawLinks)]
//         }
//         links = [...new Set(links)]
//         return links;
//     });
// }

async function extractIssueLinks(page) {
    await page.waitForSelector('.row .issue-list', { waitUntil: 'networkidle2', timeout: 50000 });
    const yearArr = await page.$$('.row .year li');
    let links = [];

    for (let i = 0; i < yearArr.length; i++) {
        const hasHref = await page.evaluate(element => element.querySelector('a') ? element.querySelector('a').hasAttribute('href') : false, yearArr[i]);
        
        if (hasHref) {
            links.push(await yearArr[i].$eval('a', a => a.href));
        } else {
            await yearArr[i].click();
            await page.waitForTimeout(1000);
            
            const rawLinks = await page.$$eval('.row .issue-list a', links => links.map(elem => elem.href));
            links.push(...rawLinks);
        }
    }

    links = Array.from(new Set(links));
    return links;
}


async function extractVolumeLinks(page) {
    return await page.evaluate(() => {
        let rawLinks =  Array.from(document.querySelectorAll('.issue-details-past-tabs li a'))
            .map(elem => elem.href)
        let links = [...new Set(rawLinks)]
        return links;
    });
}

async function choosePage(page, issue_button, volume_button){
    let links = []
    if (issue_button){
        await issue_button.click({ waitUntil: 'networkidle2', timeout: 80000 });
        links = [...links, ...await extractIssueLinks(page)]
    }
    else if (volume_button) {
        await volume_button.click({ waitUntil: 'networkidle2', timeout: 80000 });
        links = [...links, ...await extractVolumeLinks(page)]
    }
    else {
        console.log("NO PAGINATION BUTTON");
    }
    return links;
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 80000 });
    let currUrl = page.url();

    const all_issue_button = await page.$('.stats-jhp-AllIssues');
    const all_volume_button = await page.$('.stats-jhp-AllVolumes');

    let rawLinks = await choosePage(page, all_issue_button, all_volume_button);

    const contentLinks = Array.from(new Set([...rawLinks]));
    fs.appendFileSync('found_links_IEEE_issues.txt', contentLinks.join('\n') + '\n');
    console.log(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
}

async function crawlIssuesPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 80000 });
    let links_count = await getArticleCount(page)
    console.log(`links_count: ${links_count}`)
    if (links_count.length >5 ){
        console.log(`links_count > 10000: ${links_count}`)
        return;
    }
    while (true) {
        await page.waitForSelector('.text-md-md-lh')
        var rawLinks = await extractLinks(page);
        const contentLinks = Array.from(new Set([...rawLinks]));
        if (contentLinks.length < 1){
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 80000 })
        }
        let currUrl = page.url();
        fs.appendFileSync('found_links_IEEE_articles.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currUrl}; links length: ${contentLinks.length}`);
        try {
            await page.waitForSelector('.col .pagination-bar');
            // Попытка клика на кнопку paging__btn--next
            await page.click('.next-btn button', { waitUntil: 'networkidle2', timeout: 80000 });
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            break;
        }
        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        // await page.waitForTimeout(4000);
    }

}


async function main() {
    const sourceLinksPath = 'links_to_crawl.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
    console.log("CRAWLING ISSUES BEGIN:\n")
    const sourceLinksPathIssues = 'found_links_IEEE_issues.txt';
    const sourceLinksIssues = fs.readFileSync(sourceLinksPathIssues, 'utf-8').split('\n').filter(Boolean);
    for (const sourceLink of sourceLinksIssues) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlIssuesPages(sourceLink, page);
    }
    await browser.close();
}

main();