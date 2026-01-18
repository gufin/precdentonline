## ADDED Requirements

### Requirement: Автоматический деплой при коммите в main
Система SHALL автоматически запускать деплой на FTP хостинг при любом push коммите в ветку `main` через GitHub Actions.

#### Scenario: Успешный автодеплой после push
- **GIVEN** разработчик сделал изменения в коде
- **AND** изменения закоммичены и запушены в ветку `main`
- **WHEN** GitHub получает push event
- **THEN** GitHub Actions workflow SHALL автоматически запуститься
- **AND** проект SHALL быть собран через `npm run build`
- **AND** содержимое директории `dist/` SHALL быть загружено на FTP сервер
- **AND** сайт https://precedent.online SHALL отображать новые изменения

#### Scenario: Деплой не запускается для других веток
- **GIVEN** разработчик работает в feature-ветке
- **WHEN** изменения пушатся в ветку отличную от `main` (например, `feature/new-search`)
- **THEN** GitHub Actions workflow для деплоя SHALL NOT запуститься
- **AND** продакшн окружение SHALL остаться без изменений

#### Scenario: Прерывание деплоя при ошибке сборки
- **GIVEN** в коде есть синтаксическая ошибка или ошибка TypeScript
- **WHEN** изменения пушатся в `main`
- **THEN** GitHub Actions SHALL запустить сборку
- **AND** `npm run build` SHALL завершиться с ошибкой
- **AND** деплой на FTP SHALL NOT произойти
- **AND** workflow status SHALL быть помечен как "failed"
- **AND** разработчик SHALL получить уведомление об ошибке

### Requirement: Безопасное хранение FTP credentials
Система SHALL хранить FTP credentials в GitHub Secrets и использовать их в workflow без явного указания в коде.

#### Scenario: Использование credentials из GitHub Secrets
- **GIVEN** FTP credentials добавлены в GitHub Secrets репозитория
- **WHEN** GitHub Actions workflow выполняет деплой
- **THEN** credentials SHALL быть получены из secrets (`FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_SERVER_DIR`)
- **AND** credentials SHALL NOT быть видны в логах GitHub Actions
- **AND** credentials SHALL NOT присутствовать в коде workflow файла напрямую

#### Scenario: Деплой невозможен без настроенных secrets
- **GIVEN** GitHub Secrets не настроены в репозитории
- **WHEN** GitHub Actions workflow пытается выполнить деплой
- **THEN** workflow SHALL завершиться с ошибкой
- **AND** сообщение об ошибке SHALL указывать на отсутствие необходимых secrets

### Requirement: Сборка проекта в CI/CD pipeline
Система SHALL выполнять полную сборку frontend приложения в GitHub Actions перед деплоем.

#### Scenario: Установка зависимостей и сборка
- **GIVEN** GitHub Actions workflow запущен
- **WHEN** выполняется этап сборки
- **THEN** Node.js версии 18 SHALL быть установлен в runner окружении
- **AND** зависимости SHALL быть установлены через `npm ci` (clean install)
- **AND** проект SHALL быть собран через `npm run build`
- **AND** директория `dist/` SHALL содержать собранные файлы (index.html, assets/)

#### Scenario: Кэширование зависимостей для ускорения сборки
- **GIVEN** GitHub Actions workflow запущен не первый раз
- **WHEN** выполняется установка зависимостей
- **THEN** node_modules SHALL быть восстановлены из кэша если package-lock.json не изменился
- **AND** время установки зависимостей SHALL быть значительно меньше (< 30 секунд)

### Requirement: FTP деплой собранных файлов
Система SHALL загружать только собранные файлы из директории `dist/` на FTP сервер, исключая исходный код и вспомогательные файлы.

#### Scenario: Загрузка файлов на FTP через GitHub Actions
- **GIVEN** сборка проекта завершена успешно
- **WHEN** выполняется шаг FTP deploy
- **THEN** соединение SHALL быть установлено с FTP сервером используя credentials из secrets
- **AND** содержимое `dist/` SHALL быть загружено в корневую директорию FTP сервера
- **AND** только измененные файлы SHALL быть загружены (incremental deploy)

#### Scenario: Исключение ненужных файлов из деплоя
- **GIVEN** на FTP сервере могут быть временные файлы, бэкапы, .git директории
- **WHEN** FTP-Deploy-Action выполняет загрузку
- **THEN** файлы с паттернами `.git/`, `.github/`, `backup-*`, `node_modules/` SHALL быть исключены из загрузки
- **AND** только production-ready файлы из `dist/` SHALL присутствовать на сервере

#### Scenario: Обработка ошибок при FTP загрузке
- **GIVEN** FTP сервер временно недоступен или credentials неверны
- **WHEN** GitHub Actions пытается выполнить FTP deploy
- **THEN** workflow SHALL повторить попытку подключения (retry)
- **AND** если все попытки неудачны - workflow SHALL завершиться с ошибкой
- **AND** продакшн сайт SHALL остаться в предыдущем рабочем состоянии

### Requirement: Логирование и мониторинг деплоя
Система SHALL предоставлять детальные логи процесса деплоя и статус выполнения workflow.

#### Scenario: Просмотр логов деплоя
- **GIVEN** GitHub Actions workflow выполняется или завершен
- **WHEN** разработчик открывает вкладку Actions в GitHub репозитории
- **THEN** он SHALL видеть список всех запусков workflow с датой, коммитом и статусом
- **AND** при клике на workflow SHALL отображаться детальные логи каждого шага
- **AND** логи SHALL включать: установку зависимостей, результат сборки, статус FTP загрузки

#### Scenario: Уведомления о статусе деплоя
- **GIVEN** деплой завершен (успешно или с ошибкой)
- **WHEN** workflow завершает выполнение
- **THEN** автор коммита SHALL получить email уведомление от GitHub
- **AND** в репозитории SHALL отображаться badge со статусом последнего деплоя (опционально)

### Requirement: Обратная совместимость с локальным деплоем
Система SHALL сохранить возможность локального ручного деплоя через существующий скрипт `deploy.sh`.

#### Scenario: Локальный деплой продолжает работать
- **GIVEN** GitHub Actions настроен и работает
- **WHEN** разработчик запускает `npm run deploy` или `./deploy.sh` локально
- **THEN** локальный деплой SHALL выполниться успешно
- **AND** файлы SHALL быть загружены на FTP через lftp как и раньше
- **AND** резервная копия SHALL быть создана на сервере (поведение deploy.sh)

#### Scenario: Использование локального деплоя как fallback
- **GIVEN** GitHub Actions деплой не работает (проблемы с runner, FTP, secrets)
- **WHEN** требуется срочный hotfix деплой
- **THEN** разработчик SHALL использовать локальный `deploy.sh`
- **AND** деплой SHALL выполниться без зависимости от GitHub Actions

### Requirement: Документация CI/CD процесса
Система SHALL предоставлять полную документацию по настройке и использованию GitHub Actions для деплоя.

#### Scenario: Настройка автодеплоя новым разработчиком
- **GIVEN** новый разработчик получил доступ к репозиторию
- **WHEN** он читает README.md секцию "CI/CD с GitHub Actions"
- **THEN** он SHALL найти пошаговые инструкции по:
  - Добавлению GitHub Secrets (FTP_HOST, FTP_USERNAME, FTP_PASSWORD, FTP_SERVER_DIR)
  - Проверке корректности настройки workflow
  - Триггеру автоматического деплоя
  - Просмотру логов и статуса деплоя
- **AND** документация SHALL включать troubleshooting guide для частых проблем

#### Scenario: Понимание Git workflow с автодеплоем
- **GIVEN** разработчик хочет понять как изменения попадают в продакшн
- **WHEN** он читает openspec/project.md раздел Git Workflow
- **THEN** он SHALL найти описание процесса: feature branch → main → автоматический деплой
- **AND** SHALL быть указано что деплой происходит только для ветки `main`
