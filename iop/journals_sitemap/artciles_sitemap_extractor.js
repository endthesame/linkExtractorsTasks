const axios = require('axios');
const fs = require('fs');
const xml2js = require('xml2js');

async function fetchXML(url) {
    const response = await axios.get(url);
    return response.data;
}

async function parseXML(xml) {
    const parser = new xml2js.Parser();
    return parser.parseStringPromise(xml);
}

async function extractArticleLinks(url) {
    const xmlData = await fetchXML(url);
    const parsedXML = await parseXML(xmlData);

    if (parsedXML.urlset && parsedXML.urlset.url) {
        parsedXML.urlset.url.forEach(urlNode => {
            if (urlNode.loc && urlNode.loc[0]) {
                const articleLink = urlNode.loc[0];
                fs.appendFileSync('article_links.txt', articleLink + '\n');
            }
        });
    }
}

async function main() {
    const startUrl = 'https://iopscience.iop.org/sitemap.xml';
    const xmlData = await fetchXML(startUrl);
    const parsedXML = await parseXML(xmlData);

    if (parsedXML.sitemapindex && parsedXML.sitemapindex.sitemap) {
        for (const sitemapNode of parsedXML.sitemapindex.sitemap) {
            if (sitemapNode.loc && sitemapNode.loc[0] && sitemapNode.loc[0].includes('sitemap_for_volume')) {
                const volumeLink = sitemapNode.loc[0];
                console.log(`Processing volume link: ${volumeLink}`);
                await extractArticleLinks(volumeLink);
            }
        }
    }

    console.log('Article links have been saved to article_links.txt');
}

main().catch(console.error);
