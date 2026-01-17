#!/bin/bash

# Скрипт для загрузки серверной части на FTP
# Использование: ./deploy-server.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Деплой серверной части (Node.js)     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Проверка наличия lftp
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}✗ Ошибка: lftp не установлен${NC}"
    exit 1
fi

# Загрузка переменных окружения
if [ -f .env.deploy ]; then
    export $(cat .env.deploy | grep -v '^#' | xargs)
else
    echo -e "${RED}✗ Ошибка: Файл .env.deploy не найден${NC}"
    exit 1
fi

# Проверка обязательных переменных
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASSWORD" ]; then
    echo -e "${RED}✗ Ошибка: Не заданы обязательные переменные${NC}"
    exit 1
fi

# Директория для серверных файлов (относительно FTP корня)
SERVER_DIR=${SERVER_DIR:-"www/precedent.online"}

echo -e "${BLUE}[1/3]${NC} Подготовка файлов для загрузки..."

# Создаём временную директорию для серверных файлов
TEMP_DIR=".deploy-temp"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Копируем необходимые файлы
cp server.js $TEMP_DIR/
cp package.json $TEMP_DIR/
cp package-lock.json $TEMP_DIR/ 2>/dev/null || true

# Копируем .env.server как .env (если существует)
if [ -f .env.server ]; then
    cp .env.server $TEMP_DIR/.env
    echo -e "${GREEN}✓ .env.server скопирован${NC}"
else
    echo -e "${YELLOW}⚠ Внимание: .env.server не найден${NC}"
fi

echo -e "${GREEN}✓ Файлы подготовлены${NC}"
echo ""

echo -e "${BLUE}[2/3]${NC} Загрузка файлов на сервер..."
echo -e "${YELLOW}  Директория: $SERVER_DIR${NC}"
echo ""

# Загрузка через lftp
lftp -c "
set ssl:verify-certificate no;
set ftp:ssl-allow true;
set ftp:ssl-protect-data true;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
lcd $TEMP_DIR;
cd $SERVER_DIR;
mput -E server.js package.json package-lock.json .env;
bye;
"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Серверные файлы загружены${NC}"
else
    echo -e "${RED}✗ Ошибка при загрузке${NC}"
    rm -rf $TEMP_DIR
    exit 1
fi

# Очистка временной директории
rm -rf $TEMP_DIR

echo ""
echo -e "${BLUE}[3/3]${NC} Установка зависимостей на сервере..."
echo -e "${YELLOW}Теперь выполните на сервере:${NC}"
echo ""
echo -e "${GREEN}cd $SERVER_DIR${NC}"
echo -e "${GREEN}npm install --production${NC}"
echo -e "${GREEN}node server.js &${NC}"
echo ""
echo -e "${YELLOW}Или используйте PM2 для автозапуска:${NC}"
echo ""
echo -e "${GREEN}npm install -g pm2${NC}"
echo -e "${GREEN}cd $SERVER_DIR${NC}"
echo -e "${GREEN}pm2 start server.js --name precedent-api${NC}"
echo -e "${GREEN}pm2 save${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Серверные файлы загружены успешно!  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
