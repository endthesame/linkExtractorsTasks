// Функция для записи данных в файл и скачивания
function downloadTextFile(content, filename) {
    // Создаем новый Blob объект
    var blob = new Blob([content], { type: "text/plain" });

    // Создаем ссылку для скачивания файла
    var url = window.URL.createObjectURL(blob);

    // Создаем ссылку для скачивания
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Добавляем ссылку в DOM и автоматически скачиваем файл
    document.body.appendChild(link);
    link.click();

    // Удаляем ссылку из DOM
    document.body.removeChild(link);

    // Очищаем память
    window.URL.revokeObjectURL(url);
}

// Получаем содержимое XML файла по ссылке
fetch("https://ems.press/sitemap-book-chapters.xml")
    .then(response => response.text())
    .then(xmlString => {
        // Парсим XML
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // Получаем все элементы <loc>
        var locElements = xmlDoc.getElementsByTagName("loc");

        // Создаем строку для записи ссылок
        var linksContent = "";

        // Проходимся по всем найденным элементам
        for (var i = 0; i < locElements.length; i++) {
            var loc = locElements[i].textContent;

            // Проверяем, содержит ли ссылка "contents"
            if (!loc.includes("contents")) {
                // Добавляем ссылку к строке
                linksContent += loc + "\n";
            }
        }

        // Вызываем функцию для скачивания файла
        downloadTextFile(linksContent, "chapters_links.txt");
    })
    .catch(error => console.error("Произошла ошибка при загрузке XML файла:", error));


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Функция для записи данных в файл и скачивания
function downloadTextFile(content, filename) {
    // Создаем новый Blob объект
    var blob = new Blob([content], { type: "text/plain" });

    // Создаем ссылку для скачивания файла
    var url = window.URL.createObjectURL(blob);

    // Создаем ссылку для скачивания
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Добавляем ссылку в DOM и автоматически скачиваем файл
    document.body.appendChild(link);
    link.click();

    // Удаляем ссылку из DOM
    document.body.removeChild(link);

    // Очищаем память
    window.URL.revokeObjectURL(url);
}

// Получаем содержимое XML файла по ссылке
fetch("https://ems.press/sitemap-books.xml")
    .then(response => response.text())
    .then(xmlString => {
        // Парсим XML
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // Получаем все элементы <loc>
        var locElements = xmlDoc.getElementsByTagName("loc");

        // Создаем строку для записи ссылок
        var linksContent = "";

        // Проходимся по всем найденным элементам
        for (var i = 0; i < locElements.length; i++) {
            var loc = locElements[i].textContent;

            // Проверяем, содержит ли ссылка "contents"
            if (!loc.includes("contents")) {
                // Добавляем ссылку к строке
                linksContent += loc + "\n";
            }
        }

        // Вызываем функцию для скачивания файла
        downloadTextFile(linksContent, "book_links.txt");
    })
    .catch(error => console.error("Произошла ошибка при загрузке XML файла:", error));
