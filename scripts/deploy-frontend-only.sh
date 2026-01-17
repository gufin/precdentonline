#!/bin/bash
echo "📤 Загрузка фронтенда на сервер..."
echo "Введите пароль FTP при запросе"
echo ""

lftp -c "
set ssl:verify-certificate no;
open u3156202_deploy@server295.hosting.reg.ru;
cd www/precedent.online;
lcd dist;
mirror --reverse --verbose --delete --exclude-glob=server.js --exclude-glob=package*.json --exclude-glob=.env --exclude-glob=start-server.sh;
echo '';
echo '✅ Фронтенд обновлен!';
bye;
"
