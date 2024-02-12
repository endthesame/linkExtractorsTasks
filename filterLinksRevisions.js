const fs = require('fs');

// Чтение данных из первого файла
const file1 = fs.readFileSync('duke/books/1rev_duke_books.txt', 'utf8').split('\n');

// Чтение данных из второго файла
const file2 = fs.readFileSync('duke/books/found_links_duke_books.txt', 'utf8').split('\n');

// Фильтрация ссылок
const filteredLinks = file2.filter(link => !file1.includes(link));

// Запись отфильтрованных ссылок в новый файл
fs.writeFileSync('worldsc/books/filteredLinks.txt', filteredLinks.join('\n'), 'utf8');

console.log('Файл filteredLinks.txt успешно создан');