const axios = require('axios');
const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

const stateFilePath = 'crawler_state.json';
const articleLinksFilePath = 'article_links.txt';

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
                fs.appendFileSync(articleLinksFilePath, articleLink + '\n');
            }
        });
    }
}

function saveState(state) {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

function loadState() {
    if (fs.existsSync(stateFilePath)) {
        const stateData = fs.readFileSync(stateFilePath, 'utf-8');
        return JSON.parse(stateData);
    }
    return { lastProcessedVolumeLink: null };
}

async function main() {
    const startUrl = 'https://iopscience.iop.org/sitemap.xml';
    const xmlData = await fetchXML(startUrl);
    const parsedXML = await parseXML(xmlData);
    const state = loadState();

    let startProcessing = !state.lastProcessedVolumeLink;
    if (parsedXML.sitemapindex && parsedXML.sitemapindex.sitemap) {
        for (const sitemapNode of parsedXML.sitemapindex.sitemap) {
            if (sitemapNode.loc && sitemapNode.loc[0] && sitemapNode.loc[0].includes('sitemap_for_volume')) {
                const volumeLink = sitemapNode.loc[0];

                // Если находим последнюю обработанную ссылку, начинаем обработку
                if (startProcessing || state.lastProcessedVolumeLink === volumeLink) {
                    startProcessing = true;
                    console.log(`Processing volume link: ${volumeLink}`);
                    try {
                        await extractArticleLinks(volumeLink);
                        state.lastProcessedVolumeLink = volumeLink;
                        saveState(state);
                    } catch (error) {
                        console.error(`Error processing volume link ${volumeLink}: ${error.message}`);
                        saveState(state);
                        break;
                    }
                }
            }
        }
    }

    console.log('Article links have been saved to article_links.txt');
}

main().catch(console.error);
