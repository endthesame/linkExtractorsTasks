const fs = require('fs');

// Чтение файла с ссылками
const inputFile = 'worldsc/journals/recrawl_links.txt';
const outputFile = 'worldsc/journals/recrawl_links.txt';

fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка при чтении файла:', err);
        return;
    }

    // Разбиваем файл на массив строк (по предположению, что каждая ссылка находится в новой строке)
    const links = data.split('\n').map(link => link.trim());

    // Используем Set для удаления дубликатов
    const uniqueLinks = [...new Set(links)];

    // Записываем уникальные ссылки в новый файл
    fs.writeFile(outputFile, uniqueLinks.join('\n'), 'utf8', (err) => {
        if (err) {
            console.error('Ошибка при записи файла:', err);
            return;
        }
        console.log('Дубликаты удалены. Уникальные ссылки сохранены в', outputFile);
    });
});