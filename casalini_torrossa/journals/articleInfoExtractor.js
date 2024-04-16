const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractInfo(page) {
    return await page.evaluate(() => {
        let mf_journal = document.querySelector('meta[name="citation_title"]') ? document.querySelector('meta[name="citation_title"]').content.trim() : "";
        if (mf_journal == ""){
            mf_journal = document.querySelector('.uk-article-title') ? document.querySelector('.uk-article-title').innerText.trim() : "";
        }
        let mf_issn = document.querySelector('meta[name="issn"]') ? document.querySelector('meta[name="issn"]').content.trim() : "";
        if (mf_issn == ""){
            document.querySelector('.uk-accordion-content')? document.querySelector('.uk-accordion-content').innerText.match(/ISSN: (\d+-\d+[a-zA-Z]+?)/)? document.querySelector('.uk-accordion-content').innerText.match(/ISSN: (\d+-\d+[a-zA-Z]+?)/)[1] : "" : "";
        }
        return `${mf_journal};;${mf_issn}`
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });
    let currUrl = page.url()
    const contentInfo = await extractInfo(page);

    fs.appendFileSync('journals_info.txt', contentInfo + '\n');
    console.log(`Info from Page ${currUrl}: ${contentInfo}`);
}

async function main() {
    const sourceLinksPath = 'links_to_journals.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless:'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1400,
        height: 800,
        deviceScaleFactor: 1,
      });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page);
    }
}

main();