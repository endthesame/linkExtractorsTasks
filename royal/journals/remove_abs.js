const fs = require('fs');
// Чтение данных из первого файла
var file1 = fs.readFileSync('found_links_rev1_removed_abs.txt', 'utf8').split('\n');
var filtered = file1.map(elem => elem.replaceAll("abs/", ""))
fs.writeFileSync('found_links_rev1_removed_abs.txt', filtered.join('\n'), 'utf8');