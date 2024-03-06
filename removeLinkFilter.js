const fs = require('fs');


// Чтение данных
const file = fs.readFileSync('iop/books/found_links_iop_books.txt', 'utf8').split('\n');

// Фильтрация ссылок
const filteredLinks = file.filter(link => !link.includes(".pdf"));

// Запись отфильтрованных ссылок в новый файл
fs.writeFileSync('iop/books/found_links_iop_books.txt', filteredLinks.join('\n'), 'utf8');

console.log('Файл filteredLinks.txt успешно создан');