def divide_links(input_file, output_directory, num_files):
    links = []
    with open(input_file, 'r') as file:
        links = file.readlines()

    batch_size = len(links) // num_files
    remainder = len(links) % num_files

    for i in range(num_files):
        start = i * batch_size
        end = start + batch_size
        if i < remainder:
            end += 1

        with open(output_directory + 'remaining_links_' + str(i+1) + '.txt', 'w') as file:
            file.writelines(links[start:end])

# Пример использования
divide_links('D:/crawling/worldsc/books/no_date_links_books.txt', 'D:/crawling/worldsc/books/', 7)