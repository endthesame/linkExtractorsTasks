file1 = 'worldsc/journals/found_links_worldsc_journals.txt'
file2 = 'worldsc/journals/recrawl_links.txt'
output_file = 'worldsc/journals/filteredLinksNotCrawledTEST.txt'

# Чтение ссылок из файлов
with open(file1, 'r') as f1, open(file2, 'r') as f2:
    links1 = set(f1.read().splitlines())
    links2 = set(f2.read().splitlines())

# Поиск различающихся ссылок
diff_links = links2 - links1

# Запись различающихся ссылок в файл
with open(output_file, 'w') as f:
    for link in diff_links:
        f.write(link + '\n')

print(f'Различающиеся ссылки записаны в файл {output_file}')
