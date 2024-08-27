const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function extractInfo(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('ul.titles-results li.search__item')).map(elem => {
            let journalName = elem.querySelector('.meta__title') ? elem.querySelector('.meta__title').innerText.trim() : "";
            let issn = elem.querySelector('.meta__issns') ? elem.querySelector('.meta__issns').innerText.replace("ISSN: ", "").trim() : "";
            let eissn = elem.querySelector('.meta__eissn') ? elem.querySelector('.meta__eissn').innerText.replace("EISSN: ", "").trim() : "";
            // Return an object with specific keys
            return { name: journalName, issn: issn, eissn: eissn };
        });
    });
}

async function crawlPages(startUrl, results) {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });
    let linkPage = await page.url();
    console.log(`Current page: ${linkPage}`)
    
    const contentInfos = await extractInfo(page);
    results.push(...contentInfos); // Add the extracted info to the results array

    await browser.close();
}

async function main() {
    const sourceLinksPath = 'links_to_journals_info_extract.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    
    const results = []; // Initialize an array to hold all results

    // Iterate over the links from the file
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, results);
    }

    // Write results to a text file
    fs.appendFileSync('acs_journals_info.txt', results.map(info => `${info.name};;${info.issn};;${info.eissn}`).join('\n') + '\n');

    // Write results to a JSON file
    fs.writeFileSync('acs_journals_info.json', JSON.stringify(results, null, 2)); // Pretty print JSON

    console.log('Data has been written to acs_journals_info.txt and acs_journals_info.json');
}

main();