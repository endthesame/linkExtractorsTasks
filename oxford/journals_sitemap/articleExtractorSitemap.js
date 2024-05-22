const axios = require('axios');
const fs = require('fs');
const xml2js = require('xml2js');

const stateFilePath = 'oxford_crawler_state.json';
const articleLinksFilePath = 'oxford_article_links.txt';

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
            if (urlNode.loc && urlNode.loc[0] && urlNode.loc[0].includes('/article/')) {
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
    return { lastProcessedVolumeLink: null, lastProcessedManifestLink: null };
}

async function processManifestLinks(manifestLinks, state) {
    let manifestProcessed = false;
    for (const manifestLink of manifestLinks) {
        if (!state.lastProcessedManifestLink || manifestProcessed || state.lastProcessedManifestLink === manifestLink) {
            state.lastProcessedManifestLink = null; // Reset manifest state once processed
            manifestProcessed = true;
            console.log(`Processing manifest link: ${manifestLink}`);
            try {
                await extractArticleLinks(manifestLink);
                state.lastProcessedManifestLink = manifestLink;
                saveState(state);
            } catch (error) {
                console.error(`Error processing manifest link ${manifestLink}: ${error.message}`);
                saveState(state);
                break;
            }
        }
    }
    state.lastProcessedManifestLink = null; // Reset manifest state after all manifests are processed
}

async function processVolumeLinks(volumeLinks, state) {
    let volumeProcessed = false;
    for (const volumeLink of volumeLinks) {
        if (!state.lastProcessedVolumeLink || volumeProcessed || state.lastProcessedVolumeLink === volumeLink) {
            state.lastProcessedVolumeLink = null; // Reset volume state once processed
            volumeProcessed = true;
            console.log(`Processing volume link: ${volumeLink}`);
            try {
                const xmlData = await fetchXML(volumeLink);
                const parsedXML = await parseXML(xmlData);
                const manifestLinks = [];

                if (parsedXML.sitemapindex && parsedXML.sitemapindex.sitemap) {
                    parsedXML.sitemapindex.sitemap.forEach(sitemapNode => {
                        if (sitemapNode.loc && sitemapNode.loc[0]) {
                            manifestLinks.push(sitemapNode.loc[0]);
                        }
                    });
                }

                await processManifestLinks(manifestLinks, state);
                state.lastProcessedVolumeLink = volumeLink;
                saveState(state);
            } catch (error) {
                console.error(`Error processing volume link ${volumeLink}: ${error.message}`);
                saveState(state);
                break;
            }
        }
    }
    state.lastProcessedVolumeLink = null; // Reset volume state after all volumes are processed
}

async function main() {
    const startUrl = 'https://academic.oup.com/data/sitemap/sitemap.xml';
    const xmlData = await fetchXML(startUrl);
    const parsedXML = await parseXML(xmlData);
    const state = loadState();

    const volumeLinks = [];
    if (parsedXML.sitemapindex && parsedXML.sitemapindex.sitemap) {
        parsedXML.sitemapindex.sitemap.forEach(sitemapNode => {
            if (sitemapNode.loc && sitemapNode.loc[0]) {
                volumeLinks.push(sitemapNode.loc[0]);
            }
        });
    }

    await processVolumeLinks(volumeLinks, state);

    console.log('Article links have been saved to oxford_article_links.txt');
}

main().catch(console.error);
