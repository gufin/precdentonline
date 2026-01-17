#!/bin/bash

# Скрипт для загрузки .env файла на сервер через FTP

set -e

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Загрузка .env файла на сервер...${NC}"

# Загрузка переменных из .env.deploy
if [ -f .env.deploy ]; then
    export $(cat .env.deploy | grep -v '^#' | xargs)
else
    echo "Ошибка: .env.deploy не найден"
    exit 1
fi

# Проверка наличия .env.server
if [ ! -f .env.server ]; then
    echo "Ошибка: .env.server не найден"
    echo "Сначала выполните команды для создания .env.server"
    exit 1
fi

# Загрузка через lftp
lftp -u ${FTP_USER},${FTP_PASSWORD} ${FTP_HOST} <<EOF
cd ${FTP_DIR}
put .env.server -o .env
chmod 600 .env
bye
EOF

echo -e "${GREEN}✅ Файл .env успешно загружен на сервер${NC}"
echo -e "${BLUE}Проверьте: ssh ${FTP_USER}@${FTP_HOST} 'cat public_html/.env'${NC}"
