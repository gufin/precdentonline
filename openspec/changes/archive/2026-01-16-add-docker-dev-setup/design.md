# Design: Docker-контейнеризация для локальной разработки

## Context
Приложение "Прецедент Онлайн" состоит из двух компонентов:
- **Frontend:** React + Vite dev server (порт 5173)
- **Backend:** Express proxy server (порт 3001)

Текущий процесс разработки:
- Запуск: `npm run dev:all` (concurrently запускает оба сервера)
- Требуется: Node.js 18+, npm
- Конфигурация: .env файл с API ключами

Ограничения:
- Проект **НЕ использует Git для деплоя** (используется SSH/scp)
- API ключи должны оставаться защищёнными (.env не коммитится)
- Существующий dev workflow должен продолжать работать

## Goals / Non-Goals

### Goals
- Консистентное окружение разработки для всех участников команды
- Быстрый онбординг новых разработчиков (1 команда вместо 5+ шагов)
- Изоляция зависимостей проекта от системы хоста
- Сохранение hot-reload функциональности (быстрая итерация)
- Простота использования (docker-compose up и всё работает)

### Non-Goals
- Production-готовый Docker setup (фокус только на development)
- CI/CD интеграция (пока не требуется)
- Оркестрация нескольких микросервисов (приложение монолитное)
- Изменение существующего процесса деплоя через SSH

## Decisions

### Decision 1: Single Container vs Multi-Container
**Выбрано:** Single container для frontend и backend

**Обоснование:**
- Оба компонента работают в едином Node.js runtime
- Запускаются одной командой (concurrently)
- Нет необходимости в отдельной сетевой изоляции
- Упрощает конфигурацию для разработчиков

**Альтернативы:**
- ❌ Два контейнера (frontend + backend): избыточная сложность для dev-режима
- ❌ Три контейнера (+ nginx): не нужно для локальной разработки

### Decision 2: Development vs Production Build
**Выбрано:** Optimization только для development

**Обоснование:**
- Production деплой использует SSH, не Docker
- Dev-режим требует быстрого старта и hot-reload
- Многоступенчатая сборка не требуется
- Можно использовать `npm run dev:all` внутри контейнера

**Альтернативы:**
- ❌ Multi-stage build: усложняет Dockerfile без пользы для dev
- ❌ Отдельный production Dockerfile: не нужен в текущей архитектуре

### Decision 3: Volume Strategy for Hot Reload
**Выбрано:** Bind mount всего проекта + named volume для node_modules

**Обоснование:**
- Bind mount (./:/app) обеспечивает hot-reload для всех изменений
- Named volume для node_modules предотвращает конфликты с хостовой ОС
- Vite и nodemon автоматически отслеживают изменения

**Конфигурация:**
```yaml
volumes:
  - ./:/app
  - /app/node_modules  # named volume
```

### Decision 4: Environment Variables
**Выбрано:** Использование существующего .env файла через env_file

**Обоснование:**
- Совместимость с текущей настройкой (dotenv пакет)
- Безопасность: .env остаётся в .gitignore и .dockerignore
- Нулевые изменения в коде приложения
- Разработчики используют привычный workflow

**Альтернативы:**
- ❌ Переменные в docker-compose.yml: дублирование конфигурации
- ❌ Secrets в Docker: избыточно для dev-окружения

### Decision 5: Base Image
**Выбрано:** node:18-alpine

**Обоснование:**
- Alpine минимальный и быстрый (~50MB vs ~300MB для node:18)
- Содержит всё необходимое для Node.js приложения
- Соответствует требованию Node.js 18+ из project.md

**Альтернативы:**
- ❌ node:18 (Debian): больше размер образа
- ❌ node:20: может быть несовместимость с существующими зависимостями

## Risks / Trade-offs

### Risk 1: Volume Mount Performance на macOS/Windows
**Проблема:** Bind mounts медленнее на macOS/Windows (особенно с node_modules)

**Mitigation:**
- Использование named volume для node_modules
- Возможность использовать docker-sync при необходимости (документировать)
- Рекомендация: оценить производительность в реальной работе

### Risk 2: Port Conflicts
**Проблема:** Порты 3001 и 5173 могут быть заняты на хосте

**Mitigation:**
- Документировать как изменить порты в docker-compose.yml
- Добавить в troubleshooting секцию
- Можно оставить npm run dev:all как fallback

### Risk 3: Learning Curve для Docker
**Проблема:** Разработчики без опыта Docker могут столкнуться с трудностями

**Mitigation:**
- Подробная документация с примерами команд
- Сохранение старого способа запуска (npm run dev:all)
- Troubleshooting секция для частых проблем

## Migration Plan

### Phase 1: Add Docker Files (не breaking)
1. Добавить Dockerfile, docker-compose.yml, .dockerignore
2. Обновить README.md с Docker инструкциями
3. Отметить npm workflow как альтернативный способ
4. Коммит: "Add Docker development setup"

### Phase 2: Validation
1. Тестирование на разных ОС (macOS, Windows, Linux)
2. Проверка hot-reload функциональности
3. Проверка работы с API ключами
4. Сбор обратной связи от команды

### Phase 3: Documentation
1. Обновить onboarding документацию
2. Создать FAQ для Docker-специфичных вопросов
3. Видео-демонстрация (опционально)

### Rollback
- Удалить Docker файлы (Dockerfile, docker-compose.yml, .dockerignore)
- Откатить изменения в README.md
- Продолжить использовать npm run dev:all

## Open Questions
- Нужна ли интеграция с VSCode DevContainers для удобства разработки?
  → **Решение:** Добавить в будущей итерации, если появится запрос
  
- Стоит ли добавить docker-compose.prod.yml для будущего?
  → **Решение:** Нет, текущий деплой через SSH не меняется
  
- Нужен ли отдельный контейнер для тестов?
  → **Решение:** Нет, тесты пока не реализованы (см. project.md line 43)
