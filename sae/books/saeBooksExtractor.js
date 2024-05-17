const puppeteer = require('puppeteer-extra');                                                                                                                                                                      
const StealhPlugin = require('puppeteer-extra-plugin-stealth');                                                                                                                                                    
const fs = require('fs');                                                                                                                                                                                          
                                                                                                                                                                                                                   
                                                                                                                                                                                                                   
puppeteer.use(StealhPlugin());                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                   
async function extractLinks(page) {                                                                                                                                                                                
    return await page.evaluate(() => {                                                                                                                                                                             
        return Array.from(document.querySelectorAll('[pagename="browsePage"] a.mat-button'))                                                                                                                                    
            //.filter(a => a.href.match(/\/.*worldscibooks.*$/))                                                                                                                                                     
            .map(link => link.href);                                                                                                                                                                               
    });                                                                                                                                                                                                            
}                                                                                                                                                                                                                  

async function clickNext(page) {
    return await page.evaluate(() => {
        let nextButtonsArray = Array.from(document.querySelectorAll('.mat-focus-indicator[aria-label="Next page"]'))
        if (nextButtonsArray.length > 0){
            let nextButton = nextButtonsArray[0];
            nextButton.click();
            return true;
        }
        else{
            return false;
        }
    });
}

async function crawlPages(startUrl, page) {                                                                                                                                                 
    await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 50000 });
    await new Promise(resolve => setTimeout(resolve, 5000));                                                                                                                                                                                                               
    let currentPage = 0;
    let currUrl = page.url() 
                                                                                                                                                                                                                   
    while (true) {
        currUrl = page.url() 
        let rawLinks = await extractLinks(page); 
        let contentLinks = Array.from(new Set([...rawLinks]));

        if (contentLinks.length === 0) {
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 });
            rawLinks = await extractLinks(page);
            contentLinks = Array.from(new Set([...rawLinks]));
        }

        fs.appendFileSync('found_links_sae_books.txt', contentLinks.join('\n') + '\n');
        console.log(`Links from Page ${currentPage}: ${currUrl} - count: ${contentLinks.length}`);
        try {
            if(await clickNext(page)){
                console.log("clicked");
                await new Promise(resolve => setTimeout(resolve, 5000));
                //await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 });
            }else {
                return false;
            }
            // nextPageUrl = await nextUrl(page);
            // if (nextPageUrl != ""){
            //     await page.goto(nextPageUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });
            // } else {
            //     return false;
            // }


            // await page.waitForSelector('.book_link');
            // // Попытка клика на кнопку paging__btn--next
            // await page.click('.pagination-bottom-outer-wrap > div > .al-nav-next', { waitUntil: 'networkidle2', timeout: 50000 });
            
        } catch (error) {
            console.log(`Failed to click the next page button. Error: ${error.message}`);
            await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 })
        }
        // // Проверяем наличие кнопки paging__btn--next
        // const nextPageButton = await page.$('.mat-focus-indicator[aria-label="Next page"]');
        // if (!nextPageButton || (await nextPageButton.evaluate(button => button.getAttribute('aria-disabled') === 'true'))) {
        //     console.log("No next page button")
        //     break; // кнопки нет, выход из цикла
        // }

        // // Кликаем на кнопку paging__btn--next
        // try {
        //     // Попытка клика на кнопку paging__btn--next
        //     await nextPageButton.click()
        //     await page.waitForNavigation();
        // } catch (error) {
        //     console.log(`Failed to click the next page button. Error: ${error.message}`);
        //     await page.goto(currUrl, { waitUntil: 'networkidle2', timeout: 50000 });
        // }
        currentPage++;
    }

}

async function main() {
    const sourceLinksPath = 'links_to_crawl.txt';
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
