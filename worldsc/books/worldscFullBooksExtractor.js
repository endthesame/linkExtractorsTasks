const puppeteer = require('puppeteer-extra');                                                                                                                                                                      
const StealhPlugin = require('puppeteer-extra-plugin-stealth');                                                                                                                                                    
const fs = require('fs');                                                                                                                                                                                          
                                                                                                                                                                                                                   
                                                                                                                                                                                                                   
puppeteer.use(StealhPlugin());                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                   
async function extractLinks(page) {                                                                                                                                                                                
    return await page.evaluate(() => {                                                                                                                                                                             
        return Array.from(document.querySelectorAll('.titles-results a[href]'))                                                                                                                                    
            .filter(a => a.href.match(/\/.*worldscibooks.*$/))                                                                                                                                                     
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
        const contentUniqueBooksLinks = Array.from(new Set([...contentLinks]));                                                                                                                               
        fs.appendFileSync('found_links_worldsc_fullbooks.txt', contentUniqueBooksLinks.join('\n') + '\n');                                                                                     
        console.log(`Links from Page ${currentPage}: ${currUrl} - count: ${contentUniqueBooksLinks.length}`);                                                                                                                                             

         
        if (contentLinks.length === 0) {
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 });
        }

        // Проверяем наличие кнопки paging__btn--next
        const nextPageButton = await page.$('.pagination__btn--next');
        if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true')) || (await nextPageButton.evaluate(button => button.classList.contains('disabled')))) {
            break; // кнопки нет, выход из цикла
        }

        // Кликаем на кнопку paging__btn--next
        try {
            // Попытка клика на кнопку paging__btn--next
            await page.click('.pagination__btn--next');
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            break; // если не удалось кликнуть, выход из цикла
        }

        // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
        await page.waitForTimeout(10000);
        //await page.waitForSelector('.pagination__btn--next');

        currentPage++;
    }

}

async function main() {
    const sourceLinksPath = 'links_to_crawl_worldsc_fullbooks.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
