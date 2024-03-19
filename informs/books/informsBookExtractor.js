const puppeteer = require('puppeteer-extra');                                                                                                                                                                      
const StealhPlugin = require('puppeteer-extra-plugin-stealth');                                                                                                                                                    
const fs = require('fs');                                                                                                                                                                                          
                                                                                                                                                                                                                   
                                                                                                                                                                                                                   
puppeteer.use(StealhPlugin());                                                                                                                                                                                     
async function extractLinksChapters(page) {                                                                                                                                                                        
    return await page.evaluate(() => {                                                                                                                                                                             
        return Array.from(document.querySelectorAll('.issue-item__title a'))                                                                                                                                                                                                                                                                                             
            .map(link => link.href);                                                                                                                                                                               
    });                                                                                                                                                                                                            
}                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                   
async function extractMeta(page) {                                                                                                                                                                                 
    return await page.evaluate(() => {                                                                                                                                                                             
        const title = document.querySelector('.volume--title')? document.querySelector('.volume--title').innerText : "";                                                                                            
        const series = 'TutORials in Operations Research';                                                    
        //const subtitle = document.querySelector('.meta__info > .subtitle')? document.querySelector('.meta__info > .subtitle').innerText.replaceAll("\n", " ").trim() : '';                                         
        const isbn = document.querySelector('.xxlt-grey-bg')? document.querySelector('.xxlt-grey-bg').innerText.match(/ISBN .*/) : "";                                                                                                                                                                         
        //const eisbn = document.body.innerText.trim().match(/\s*ISBN:\s*(\d+-\d+-\d+-\d+-\d+)\s*\(ebook\)\s*/)? document.body.innerText.trim().match(/\s*ISBN:\s*(\d+-\d+-\d+-\d+-\d+)\s*\(ebook\)\s*/)[1] : "";    
        const metaContent = `${title};;${series};;${isbn}`;                                                                                                                                 
        return metaContent;                                                                                                                                                                                        
    });                                                                                                                                                                                                            
}

async function crawlPages(startUrl, page, browser) {                                                                                                                                                       [20/102]
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });                                                                                                                                      
                                                                                                                                                                                                                   
    await page.waitForTimeout(3000);                                                                                                                                                                               
                                                                                                                                                                                                                   
    let currentPage = 1;                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                  
    var rawLinks = await extractLinksChapters(page);                                                                                                                                                                   
    const contentLinks = Array.from(new Set([...rawLinks]));
    fs.appendFileSync('found_links_informs_books_chapters.txt', contentLinks.join('\n') + '\n');                                                                                     
    console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);                                                                                                                     
    var meta = await extractMeta(page);                                                                                                                                                                 
    fs.appendFileSync('found_links_informs_books_meta.txt', meta + '\n');                                                                                                                
    console.log(`Links from Page ${currentPage} have been saved to found_links.txt!`);                                                                                                                                               
    
    await page.waitForTimeout(3000);

    currentPage++;
}

async function main() {
    const sourceLinksPath = 'links_to_books.txt';
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
