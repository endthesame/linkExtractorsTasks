const puppeteer = require('puppeteer-extra');                                                                                                                                                                      
const StealhPlugin = require('puppeteer-extra-plugin-stealth');                                                                                                                                                    
const fs = require('fs');                                                                                                                                                                                          
                                                                                                                                                                                                                   
                                                                                                                                                                                                                   
puppeteer.use(StealhPlugin());                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                   
async function extractLinks(page) {                                                                                                                                                                                
    return await page.evaluate(() => {                                                                                                                                                                             
        return Array.from(document.querySelectorAll('.search-result .col-md-11 h2 a'))                                                                                                                                    
            //.filter(a => a.href.match(/\/.*worldscibooks.*$/))                                                                                                                                                     
            .map(link => link.href);                                                                                                                                                                               
    });                                                                                                                                                                                                            
}                                                                                                                                                                                                                  


async function crawlPages(startUrl, page) {                                                                                                                                                 
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 50000 });                                                                                                                                                                                                                  
    let currentPage = 0;
    let currUrl = page.url() 
                                                                                                                                                                                                                   
    while (true) {
        currUrl = page.url() 
        let rawLinks = await extractLinks(page); 
        const contentLinks = Array.from(new Set([...rawLinks]));

        if (contentLinks.length === 0) {
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 });
            rawLinks = await extractLinks(page);
            contentLinks = Array.from(new Set([...rawLinks]));
        }

        fs.appendFileSync('found_links_sae_journals.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currentPage}: ${currUrl} - count: ${contentLinks.length}`);

        await page.waitForTimeout(1000);

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.paging span a[rel="next"]');
        if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true'))) {
            break; // кнопки нет, выход из цикла
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.paging span a[rel="next"]');
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 });
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        //await page.waitForTimeout(10000);
        //await page.waitForSelector('.pagination__btn--next');
        await page.waitForSelector('.paging',{ waitUntil: 'networkidle2', timeout: 50000 })

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
