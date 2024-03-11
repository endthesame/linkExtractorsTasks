const fs = require('fs');


// Чтение данных
const file = fs.readFileSync('acs/journals/found_links_acsFILTERED.txt', 'utf8').split('\n');

// Фильтрация ссылок
const filteredLinks = file.filter(link => !link.includes("adclick.g.doubleclick"));

// Запись отфильтрованных ссылок в новый файл
fs.writeFileSync('acs/journals/found_links_acsFILTERED.txt', filteredLinks.join('\n'), 'utf8');

console.log('Файл filteredLinks.txt успешно создан');