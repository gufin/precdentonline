# Вспомогательные скрипты

Эта папка содержит вспомогательные скрипты для разработки и деплоя проекта.

## 📦 Скрипты деплоя

### `deploy-frontend-only.sh`
Загрузка только фронтенда (dist/) на FTP сервер без серверных файлов.

**Использование:**
```bash
./scripts/deploy-frontend-only.sh
```

### `deploy-server.sh`
Загрузка серверной части (server.js, package.json, .env) на FTP сервер.

**Использование:**
```bash
./scripts/deploy-server.sh
```

### `upload-server-files.sh`
Быстрая загрузка серверных файлов через lftp.

**Использование:**
```bash
./scripts/upload-server-files.sh
```

### `upload-env.sh`
Загрузка .env файла на сервер.

**Использование:**
```bash
./scripts/upload-env.sh
```

---

## 🖥️ Скрипты для сервера

### `start-server.sh`
Запуск Node.js сервера на продакшне (загружается на сервер).

**Использование на сервере:**
```bash
./start-server.sh
```

### `check-server.sh`
Вывод команд для диагностики сервера.

**Использование:**
```bash
./scripts/check-server.sh
```

---

## 🌐 Cloudflare Worker

### `cloudflare-worker.js`
Код для Cloudflare Worker, который используется как прокси для Recognition API.

**Не требуется**, если CORS настроен на сервере `dev.you-right.ru`.

**Использование:**
1. Зарегистрируйтесь на https://workers.cloudflare.com
2. Создайте новый Worker
3. Скопируйте код из этого файла
4. Деплойте

---

## 🧪 Тестирование

### `check-cors.html`
HTML страница для тестирования CORS запросов к Recognition API.

**Использование:**
Откройте файл в браузере: `file:///.../scripts/check-cors.html`

---

## Основные скрипты

Основные скрипты остаются в корне проекта:

- `deploy.sh` - основной скрипт деплоя (сборка + загрузка фронтенда)
- `server.js` - Node.js сервер с прокси для API

---

## Примечания

- Большинство скриптов требуют наличия `.env.deploy` файла с настройками FTP
- Для работы скриптов нужен `lftp` (установка: `brew install lftp`)
- Серверные скрипты (server.js, start-server.sh) не используются на shared hosting
