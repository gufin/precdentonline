#!/bin/bash
# Автоматическая загрузка серверных файлов

echo "📤 Загружаем серверные файлы..."
echo ""
echo "Используйте пароль от FTP при запросе"
echo ""

lftp -c "
set ssl:verify-certificate no;
open u3156202_deploy@server295.hosting.reg.ru;
cd www/precedent.online;
put server.js;
put package.json;
put package-lock.json;
put .env.server -o .env;
put start-server.sh;
chmod 755 start-server.sh;
echo 'Загружено! Проверяем...';
ls -la;
bye;
"

echo ""
echo "✅ Файлы загружены!"
