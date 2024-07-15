const axios = require('axios');
const fs = require('fs');
const xml2js = require('xml2js');

// Функция для парсинга XML
const parseXML = (xml) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Функция для загрузки и парсинга XML с обработкой ошибок
const fetchAndParseXML = async (url) => {
  try {
    const response = await axios.get(url);
    return parseXML(response.data);
  } catch (error) {
    console.error(`Failed to fetch or parse XML from ${url}: ${error.message}`);
    return null;
  }
};

// Функция для сохранения состояния
const saveState = (state, stateFile) => {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
};

// Функция для загрузки состояния
const loadState = (stateFile) => {
  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile));
  }
  return null;
};

// Рекурсивная функция для краулинга sitemap
const crawlSitemap = async (url, linksFile, state, stateFile) => {
  console.log(`Crawling: ${url}`);
  const sitemap = await fetchAndParseXML(url);

  if (!sitemap) {
    // Если sitemap не удалось загрузить или распарсить, пропускаем его
    state.failed.push(url);
    saveState(state, stateFile);
    return;
  }

  if (sitemap.urlset && sitemap.urlset.url) {
    // Это конечный sitemap с ссылками на страницы
    let links = sitemap.urlset.url;
    if (!Array.isArray(links)) {
      links = [links]; // Преобразуем в массив, если это не массив
    }
    links = links.map((u) => u.loc);
    fs.appendFileSync(linksFile, links.join('\n') + '\n');
    state.completed.push(url);
  } else if (sitemap.sitemapindex && sitemap.sitemapindex.sitemap) {
    // Это sitemap с другими sitemaps
    let subSitemaps = sitemap.sitemapindex.sitemap;
    if (!Array.isArray(subSitemaps)) {
      subSitemaps = [subSitemaps]; // Преобразуем в массив, если это не массив
    }
    subSitemaps = subSitemaps.map((s) => s.loc);

    for (const subSitemap of subSitemaps) {
      if (!state.completed.includes(subSitemap)) {
        await crawlSitemap(subSitemap, linksFile, state, stateFile);
      }
    }
    state.completed.push(url);
  }

  saveState(state, stateFile);
};

// Основная функция
const main = async () => {
  const rootSitemap = 'https://karger.com/data/sitemap/sitemap.xml';
  const linksFile = 'links.txt';
  const stateFile = 'state.json';

  let state = loadState(stateFile);
  if (!state) {
    state = { completed: [], failed: [] };
  }

  await crawlSitemap(rootSitemap, linksFile, state, stateFile);

  console.log('Crawling completed.');
};

main().catch(console.error);
