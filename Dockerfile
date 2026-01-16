# Dockerfile для локальной разработки
# Base: Node.js 18 Alpine (минимальный и быстрый образ)
FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование package files для установки зависимостей
# Копируем отдельно для использования Docker cache layer
COPY package*.json ./

# Установка зависимостей
# Используем npm ci для чистой установки из package-lock.json
RUN npm ci

# Копирование остальных файлов проекта
# В dev режиме это будет перезаписано volume mount
COPY . .

# Экспозиция портов
# 3001 - Backend Express API
# 5173 - Frontend Vite dev server
EXPOSE 3001 5173

# Команда запуска для development режима
# Запускает concurrently оба сервера (backend + frontend)
CMD ["npm", "run", "dev:all"]
