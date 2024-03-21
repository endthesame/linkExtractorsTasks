const fs = require('fs');


// Чтение данных
const file = fs.readFileSync('rsc/books/found_links_rsc_books.txt', 'utf8').split('\n');

// Фильтрация ссылок
const filteredLinks = file.filter(link => !link.includes("adclick.g.doubleclick"));

// Запись отфильтрованных ссылок в новый файл
fs.writeFileSync('rsc/books/found_links_rsc_books.txt', filteredLinks.join('\n'), 'utf8');

console.log('Файл filteredLinks.txt успешно создан');