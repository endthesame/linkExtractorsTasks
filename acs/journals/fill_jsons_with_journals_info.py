import os
import json
import logging

# Настройка логирования
logging.basicConfig(
    filename='update_journals.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

jsons_folder_path = 'jsons'

journals_info_path = 'acs_journals_info.json'

try:
    with open(journals_info_path, 'r', encoding='utf-8') as file:
        acs_journals_info = json.load(file)
except json.JSONDecodeError as e:
    logging.error(f"Ошибка при загрузке JSON файла: {e}")
    raise
except FileNotFoundError:
    logging.error(f"Файл не найден: {journals_info_path}")
    raise
except Exception as e:
    logging.error(f"Произошла ошибка: {e}")
    raise 

for file in os.listdir(jsons_folder_path):
    if file.endswith('.json'):
        file_path = os.path.join(jsons_folder_path, file)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                json_data = json.load(file)
        except json.JSONDecodeError as e:
            logging.error(f"Ошибка при загрузке JSON файла {file}: {e}")
            continue 
        except Exception as e:
            logging.error(f"Произошла ошибка при обработке файла {file}: {e}")
            continue
        
        matching_journal = next((journal for journal in acs_journals_info if journal['name'] == json_data['232']), None)
        
        if matching_journal:
            json_data['184'] = matching_journal['issn']
            json_data['185'] = matching_journal['eissn']
            
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(json_data, file, indent=2, ensure_ascii=False)
            log_message = f"Updated file: {file}"
            print(log_message)
            logging.info(log_message)
        else:
            log_message = f"No match found for file: {file}"
            print(log_message)
            logging.info(log_message)