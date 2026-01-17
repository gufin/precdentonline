#!/bin/bash

# Скрипт автоматического деплоя на FTP сервер
# Использование: ./deploy.sh или npm run deploy

set -e  # Прервать выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Прецедент Онлайн - Деплой на FTP   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Проверка наличия lftp
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}✗ Ошибка: lftp не установлен${NC}"
    echo -e "${YELLOW}Установите его командой: brew install lftp${NC}"
    exit 1
fi

# Загрузка переменных окружения из .env.deploy
if [ -f .env.deploy ]; then
    export $(cat .env.deploy | grep -v '^#' | xargs)
else
    echo -e "${RED}✗ Ошибка: Файл .env.deploy не найден${NC}"
    echo -e "${YELLOW}Создайте файл .env.deploy с настройками FTP (см. .env.deploy.example)${NC}"
    exit 1
fi

# Проверка обязательных переменных
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASSWORD" ]; then
    echo -e "${RED}✗ Ошибка: Не заданы обязательные переменные в .env.deploy${NC}"
    echo -e "${YELLOW}Необходимо указать: FTP_HOST, FTP_USER, FTP_PASSWORD${NC}"
    exit 1
fi

# Установка директории по умолчанию
FTP_DIR=${FTP_DIR:-"/"}

echo -e "${BLUE}[1/4]${NC} Сборка проекта..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Ошибка: Директория dist не создана${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Проект собран${NC}"
echo ""

echo -e "${BLUE}[2/4]${NC} Создание бэкапа на сервере..."
# Создаем бэкап текущей версии на сервере
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"

lftp -c "
set ssl:verify-certificate no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
mkdir -f $BACKUP_NAME 2>/dev/null || true;
mirror --verbose --exclude-glob=backup-* --exclude-glob=.* / $BACKUP_NAME;
bye;
" 2>&1 | grep -E "(mkdir|bytes|total|^$)" || true

echo -e "${GREEN}✓ Бэкап создан: $BACKUP_NAME${NC}"
echo ""

echo -e "${BLUE}[3/4]${NC} Загрузка файлов на FTP..."
echo -e "${YELLOW}  Сервер: $FTP_HOST${NC}"
echo -e "${YELLOW}  Пользователь: $FTP_USER${NC}"
echo -e "${YELLOW}  Директория: $FTP_DIR${NC}"
echo ""

# Загрузка файлов через lftp
lftp -c "
set ssl:verify-certificate no;
set ftp:ssl-allow true;
set ftp:ssl-protect-data true;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
lcd dist;
cd $FTP_DIR;
mirror --reverse --verbose --delete --exclude-glob=backup-* --exclude-glob=.htaccess --exclude-glob=.well-known/ --parallel=3;
bye;
"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Файлы загружены${NC}"
else
    echo -e "${RED}✗ Ошибка при загрузке файлов${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}[4/4]${NC} Проверка загрузки..."

# Проверка наличия index.html на сервере
lftp -c "
set ssl:verify-certificate no;
open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
cd $FTP_DIR;
cls -1 index.html;
bye;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ index.html найден на сервере${NC}"
else
    echo -e "${YELLOW}⚠ Предупреждение: index.html не найден на сервере${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Деплой завершен успешно!       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Ваш сайт доступен по адресу: https://precedent.online${NC}"
echo -e "${YELLOW}📦 Бэкап сохранен как: $BACKUP_NAME${NC}"
echo ""
