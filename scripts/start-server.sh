#!/bin/bash

# Скрипт для запуска Node.js сервера на продакшне
# Этот файл нужно загрузить на сервер и запустить там

# Настройки
PORT=${PORT:-3001}
NODE_ENV=${NODE_ENV:-production}
LOG_FILE="server.log"

# Убиваем старый процесс, если есть
OLD_PID=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$OLD_PID" ]; then
    echo "Останавливаем старый процесс (PID: $OLD_PID)..."
    kill $OLD_PID
    sleep 2
fi

# Загружаем переменные окружения из .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Переменные окружения загружены из .env"
else
    echo "⚠ Внимание: Файл .env не найден"
fi

# Устанавливаем NODE_TLS_REJECT_UNAUTHORIZED для dev.you-right.ru
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "Запуск сервера..."
echo "  PORT: $PORT"
echo "  NODE_ENV: $NODE_ENV"
echo "  Логи: $LOG_FILE"
echo ""

# Запускаем сервер в фоновом режиме
nohup node server.js > $LOG_FILE 2>&1 &
NEW_PID=$!

echo "✓ Сервер запущен (PID: $NEW_PID)"
echo "Просмотр логов: tail -f $LOG_FILE"
echo ""

# Ждём секунду и проверяем, что процесс всё ещё работает
sleep 1
if ps -p $NEW_PID > /dev/null; then
    echo "✓ Сервер работает"
else
    echo "✗ Ошибка: Сервер не запустился"
    echo "Последние строки лога:"
    tail -20 $LOG_FILE
    exit 1
fi
