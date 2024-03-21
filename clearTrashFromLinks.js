const fs = require('fs');


// Чтение данных
const file = fs.readFileSync('rsc/books/found_links_rsc_books.txt', 'utf8').split('\n');

// Фильтрация ссылок
const filteredLinks = file.map(link => link.replace("?searchresult=1", ""));

// Запись отфильтрованных ссылок в новый файл
fs.writeFileSync('rsc/books/found_links_rsc_books.txt', filteredLinks.join('\n'), 'utf8');

console.log('Файл успешно изменен');