const fs = require('fs');

// Чтение данных из первого файла
const file1 = fs.readFileSync('royal/journals/found_links_rev1_removed_abs.txt', 'utf8').split('\n');

// Чтение данных из второго файла
const file2 = fs.readFileSync('royal/journals/found_links.txt', 'utf8').split('\n');

// Фильтрация ссылок
const filteredLinks = file2.filter(link => !file1.includes(link));

// Запись отфильтрованных ссылок в новый файл
fs.writeFileSync('royal/journals/filteredLinks.txt', filteredLinks.join('\n'), 'utf8');

console.log('Файл filteredLinks.txt успешно создан');