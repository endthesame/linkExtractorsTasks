const puppeteer = require('puppeteer-extra');                                                                                                                                                                      
const StealhPlugin = require('puppeteer-extra-plugin-stealth');                                                                                                                                                    
const fs = require('fs');                                                                                                                                                                                          
                                                                                                                                                                                                                   
                                                                                                                                                                                                                   
puppeteer.use(StealhPlugin());                                                                                                                                                                                     
async function extractLinksChapters(page) {                                                                                                                                                                        
    return await page.evaluate(() => {                                                                                                                                                                             
        return Array.from(document.querySelectorAll('.issue-item a[href]'))                                                                                                                                        
            .filter(a => a.href.match(/\/doi\/\d+.\d+.*$/))                                                                                                                                                        
            .map(link => link.href);                                                                                                                                                                               
    });                                                                                                                                                                                                            
}                                                                                                                                                                                                                  
                                                                                                                                                                                                                   
async function extractLinks(page) {                                                                                                                                                                                
    return await page.evaluate(() => {                                                                                                                                                                             
        return Array.from(document.querySelectorAll('.titles-results a[href]'))                                                                                                                                    
            .filter(a => a.href.match(/\/.*worldscibooks.*$/))                                                                                                                                                     
            .map(link => link.href);                                                                                                                                                                               
    });                                                                                                                                                                                                            
}                                                                                                                                                                                                                  
                                                                                                                                                                                                                   
async function extractMeta(page) {                                                                                                                                                                                 
    return await page.evaluate(() => {                                                                                                                                                                             
        const title = document.querySelector('.meta__title')? document.querySelector('.meta__title').innerText : '';                                                                                               
        const series = document.querySelector('.meta__seriestitle')? document.querySelector('.meta__seriestitle').innerText.replaceAll("\n", " ").trim() : '';                                                     
        const subtitle = document.querySelector('.meta__info > .subtitle')? document.querySelector('.meta__info > .subtitle').innerText.replaceAll("\n", " ").trim() : '';                                         
        const isbn = document.querySelector('#eisbndisplay')? document.querySelector('#eisbndisplay').innerText.match(/ISBN: (\d+-\d+-\d+-\d+-\d+)/)? document.querySelector('#eisbndisplay').innerText.match(/ISBN: (\d+-\d+-\d+-\d+-\d+)/)[1] : "" : "";                                                                                                                                                                            
        const eisbn = document.body.innerText.trim().match(/\s*ISBN:\s*(\d+-\d+-\d+-\d+-\d+)\s*\(ebook\)\s*/)? document.body.innerText.trim().match(/\s*ISBN:\s*(\d+-\d+-\d+-\d+-\d+)\s*\(ebook\)\s*/)[1] : "";    
        const metaContent = `${title};;${series};;${subtitle};;${isbn};;${eisbn}`;                                                                                                                                 
        return metaContent;                                                                                                                                                                                        
    });                                                                                                                                                                                                            
}

async function crawlPages(startUrl, page, browser) {                                                                                                                                                       [20/102]
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });                                                                                                                                      
                                                                                                                                                                                                                   
    await page.waitForTimeout(2000);                                                                                                                                                                               
                                                                                                                                                                                                                   
    let currentPage = 1;                                                                                                                                                                                           
                                                                                                                                                                                                                   
    while (true) {                                                                                                                                                                                                 
        var rawLinks = await extractLinks(page);                                                                                                                                                                   
        const contentLinks = Array.from(new Set([...rawLinks]));                                                                                                                                                   
        for (const contentLink of contentLinks) {                                                                                                                                                                  
            console.log(`Crawling page ${currentPage} for content link: ${contentLink}`);                                                                                                                          
            const newPage = await browser.newPage();                                                                                                                                                               
            await newPage.goto(contentLink, { waitUntil: 'networkidle0', timeout: 50000 });                                                                                                                        
            await newPage.waitForTimeout(3000);                                                                                                                                                                    
            var rawLinksChapters = await extractLinksChapters(newPage);                                                                                                                                            
            const contentLinksChapters = Array.from(new Set([...rawLinksChapters]));                                                                                                                               
            fs.appendFileSync('found_links_worldsc_books_chapters.txt', contentLinksChapters.join('\n') + '\n');                                                                                     
            console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);                                                                                                                     
            var meta = await extractMeta(newPage);                                                                                                                                                                 
            fs.appendFileSync('found_links_worldsc_books_meta.txt', meta + '\n');                                                                                                                    
            console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);
            await newPage.close();
        }
         
        // if (contentLinks.length === 0) {
        //     break; // нет ссылок, выход из цикла
        // }

        // fs.appendFileSync('crawled_links/found_links_worldsc_books.txt', contentLinks.join('\n') + '\n');
        // console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);

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
    const sourceLinksPath = 'links_to_crawl_worldsc_books.txt';
    const sourceLinks = fs.readFileSync(sourceLinksPath, 'utf-8').split('\n').filter(Boolean);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Итерация по ссылкам из файла
    for (const sourceLink of sourceLinks) {
        console.log(`Crawling pages for source link: ${sourceLink}`);
        await crawlPages(sourceLink, page, browser); 
    }
    await browser.close();
}

main();
