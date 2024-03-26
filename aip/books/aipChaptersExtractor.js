const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractLinks(page) {
    return await page.evaluate(() => {
        let rawChaptersLinks =  Array.from(document.querySelectorAll('.bookToc .tocLink a'))
            .map(link => link.href);
        let rawChaptersLinksPrev =  Array.from(document.querySelectorAll('.bookToc .sectiontype-0 span a'))
            .map(link => link.href);
        let rawAllLinks = [...rawChaptersLinksPrev, ...rawChaptersLinks]
        let uniqueLinks = [...new Set(rawAllLinks)];
        return uniqueLinks;
    });
}

async function crawlPages(startUrl, page) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });

    await page.waitForTimeout(1000);

    const contentLinks = await extractLinks(page);

    fs.appendFileSync('found_links_aip_chapters.txt', contentLinks.join('\n') + '\n');
    console.log(`Links from Page ${startUrl} have been saved to found_links.txt!`);

}

async function main() {
    const sourceLinksPath = 'links_to_books.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);

    const browser = await puppeteer.launch({ headless:false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
    await browser.close();
}

main();