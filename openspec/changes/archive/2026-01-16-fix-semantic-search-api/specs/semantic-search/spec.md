# Semantic Search Capability

## ADDED Requirements

### Requirement: API Connection Configuration
Система ДОЛЖНА (SHALL) использовать правильный URL для подключения к API семантического поиска.

#### Scenario: Production environment
- **WHEN** система инициализируется в production окружении
- **THEN** базовый URL для семантического API ДОЛЖЕН быть `https://semsearch.ru/`
- **AND** все запросы ДОЛЖНЫ использовать HTTPS протокол

#### Scenario: Local development
- **WHEN** разработчик запускает приложение локально
- **THEN** система ДОЛЖНА использовать переменную окружения `SEMANTIC_API_BASE` если она задана
- **OR** использовать значение по умолчанию `https://semsearch.ru/`

### Requirement: Filters Support
Система ДОЛЖНА (SHALL) поддерживать все фильтры, доступные в API семантического поиска.

#### Scenario: Date range filtering
- **WHEN** пользователь задаёт диапазон дат для поиска
- **THEN** система ДОЛЖНА отправить `date_from` и `date_to` в формате ISO 8601 (YYYY-MM-DD)
- **AND** API ДОЛЖЕН вернуть только документы в указанном диапазоне дат

#### Scenario: Court filtering
- **WHEN** пользователь задаёт название суда для фильтрации
- **THEN** система ДОЛЖНА отправить точное название суда в параметре `court`
- **AND** API ДОЛЖЕН выполнить точное совпадение (exact match)

#### Scenario: Document type filtering
- **WHEN** пользователь задаёт тип документа (например, "Решение" или "Постановление")
- **THEN** система ДОЛЖНА отправить тип документа в параметре `doctype`
- **AND** API ДОЛЖЕН вернуть только документы указанного типа

#### Scenario: Categories filtering
- **WHEN** пользователь задаёт одну или несколько категорий дел
- **THEN** система ДОЛЖНА отправить массив категорий в параметре `categories`
- **AND** API ДОЛЖЕН вернуть документы, соответствующие хотя бы одной категории (OR условие)

#### Scenario: No filters
- **WHEN** пользователь не задаёт фильтры
- **THEN** система ДОЛЖНА отправить запрос без параметра `filters` или с `filters: null`
- **AND** API ДОЛЖЕН выполнить поиск по всей базе данных

### Requirement: Response Handling
Система ДОЛЖНА (SHALL) корректно обрабатывать ответы от API семантического поиска.

#### Scenario: Successful search with categories
- **WHEN** API возвращает результаты с полем `categories`
- **THEN** система ДОЛЖНА сохранить категории в результатах
- **AND** категории ДОЛЖНЫ быть доступны для отображения пользователю

#### Scenario: Connection error
- **WHEN** не удаётся подключиться к API (сетевая ошибка, таймаут)
- **THEN** система ДОЛЖНА показать понятное сообщение об ошибке: "Семантический поиск недоступен: не удалось подключиться к серверу"
- **AND** НЕ ДОЛЖНА показывать технические детали пользователю

#### Scenario: SSL/TLS error
- **WHEN** возникает ошибка при проверке SSL сертификата
- **THEN** система ДОЛЖНА залогировать ошибку
- **AND** показать сообщение: "Проблема с безопасным подключением к сервису поиска"

### Requirement: Type Safety
Система ДОЛЖНА (SHALL) иметь корректные TypeScript типы для всех структур данных семантического поиска.

#### Scenario: SearchFilters type
- **WHEN** разработчик создаёт объект фильтров
- **THEN** тип `SearchFilters` ДОЛЖЕН включать все поддерживаемые поля:
  - `date_from?: string | null`
  - `date_to?: string | null`
  - `court?: string | null`
  - `doctype?: string | null`
  - `categories?: string[] | null`

#### Scenario: SearchResultItem type
- **WHEN** система получает результаты поиска
- **THEN** тип `SearchResultItem` ДОЛЖЕН включать поле `categories?: string[] | null`
- **AND** функция адаптации `adaptSearchResultToCaseRecord` ДОЛЖНА корректно обрабатывать это поле

### Requirement: Documentation
Система ДОЛЖНА (SHALL) иметь актуальную документацию об API семантического поиска.

#### Scenario: README documentation
- **WHEN** разработчик читает README.md
- **THEN** README ДОЛЖЕН содержать информацию о:
  - Базовом URL семантического API: `https://semsearch.ru/`
  - Необходимости API ключа (`SEMANTIC_API_KEY`)
  - Доступных фильтрах и их формате
  - Различиях между классическим и семантическим поиском

#### Scenario: Code comments
- **WHEN** разработчик читает код `services/api.ts`
- **THEN** код ДОЛЖЕН содержать комментарии, объясняющие:
  - Какие фильтры поддерживаются семантическим поиском
  - Формат даты для фильтров (ISO 8601)
  - Назначение каждого параметра запроса
