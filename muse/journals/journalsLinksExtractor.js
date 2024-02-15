const puppeteer = require('puppeteer-extra');                                                                                                                                                                      
const StealhPlugin = require('puppeteer-extra-plugin-stealth');                                                                                                                                                    
const fs = require('fs');                                                                                                                                                                                          
                                                                                                                                                                                                                   
                                                                                                                                                                                                                   
puppeteer.use(StealhPlugin());

async function extractLinksArticles(page) {                                                                                                                                                                        
    return await page.evaluate(() => {                                                                                                                                                                             
        let raw_articles = Array.from(document.querySelectorAll('.articles_list_text .title a'))                                                                                                                                                                                                                                                                                            
            .map(link => link.href);  
        return [...new Set(raw_articles)];                                                                                                                                                                               
    });                                                                                                                                                                                                            
}                                                                                                                                                                                                                  
                                                                                                                                                                                                                   
async function extractLinksVolumes(page) {                                                                                                                                                                                
    return await page.evaluate(() => {                                                                                                                                                                             
        let raw_links =  Array.from(document.querySelectorAll('.volume a'))                                                                                                                                                                                                                                                                                    
            .map(link => link.href);
        return [...new Set(raw_links)];                                                                                                                                                                    
    });                                                                                                                                                                                                            
}                                                                                                                                                                                                                                                                                                                                                                                                                        

async function crawlPages(startUrl, page, browser) {                                                                                                                                                       [20/102]
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });                                                                                                                                      
                                                                                                                                                                                                                   
    await page.waitForTimeout(2000);                                                                                                                                                                               
                                                                                                                                                                                                                   
    let currentPage = 1;                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                 
    var rawLinks = await extractLinksVolumes(page);                                                                                                                                                                   
    const contentLinks = Array.from(new Set([...rawLinks]));                                                                                                                                                   
    for (const contentLink of contentLinks) {                                                                                                                                                                  
        console.log(`Crawling page ${currentPage} for content link: ${contentLink}`);                                                                                                                          
        const newPage = await browser.newPage();                                                                                                                                                               
        await newPage.goto(contentLink, { waitUntil: 'networkidle0', timeout: 50000 });                                                                                                                        
        await newPage.waitForTimeout(2000);                                                                                                                                                                    
        var rawLinksChapters = await extractLinksArticles(newPage);                                                                                                                                            
        const contentLinksChapters = Array.from(new Set([...rawLinksChapters]));                                                                                                                               
        fs.appendFileSync('found_links_muse_journals.txt', contentLinksChapters.join('\n') + '\n');                                                                                     
        console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);                                                                                                                     
        await newPage.close();
    }

    // Ждем загрузки нового контента (возможно, потребуется настройка времени ожидания)
    await page.waitForTimeout(2000);
    //await page.waitForSelector('.pagination__btn--next');

    currentPage++;

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
        await crawlPages(sourceLink, page, browser); 
    }
    await browser.close();
}

main();
