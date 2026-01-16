# Резюме: Исправление семантического поиска

## Проведённый анализ

### 1. Исследование API semsearch.ru
Проверил доступность API по адресу https://semsearch.ru/ и получил полную спецификацию OpenAPI.

**Ключевые находки:**
- ✅ API доступен и работает
- ✅ Домен `semsearch.ru` резолвится в `195.35.56.180` (тот же IP, что используется сейчас)
- ✅ API поддерживает HTTPS (SSL сертификат настроен)
- ✅ Документация доступна через Swagger UI по адресу https://semsearch.ru/docs

### 2. Найденные проблемы

#### Проблема 1: Неправильный URL
**Текущее состояние:**
```typescript
// services/api.ts, line 11
semanticApiBase: import.meta.env.VITE_SEMANTIC_API_BASE || 'http://195.35.56.180'
```

**Что не так:**
- Используется HTTP вместо HTTPS
- Используется IP адрес вместо доменного имени
- Это приводит к ошибкам подключения и проблемам с SSL

**Решение:**
```typescript
semanticApiBase: import.meta.env.VITE_SEMANTIC_API_BASE || 'https://semsearch.ru/'
```

#### Проблема 2: Отсутствует поддержка фильтра categories

**API поддерживает следующие фильтры:**
```typescript
interface SearchFilters {
  date_from?: string | null;     // ✅ Есть в коде
  date_to?: string | null;       // ✅ Есть в коде
  court?: string | null;         // ✅ Есть в коде
  doctype?: string | null;       // ✅ Есть в коде
  categories?: string[] | null;  // ❌ ОТСУТСТВУЕТ в коде!
}
```

**Решение:**
Добавить поле `categories` в типы `SearchFilters` и `SearchResultItem`.

### 3. Спецификация API (из OpenAPI)

#### Эндпоинты:
- `POST /api/v1/search` - семантический поиск
- `GET /api/v1/cases/{case_number}` - получение полного текста дела
- `GET /health` - проверка здоровья сервиса

#### Аутентификация:
- Header: `X-API-Key: <your-key>`

#### Формат запроса поиска:
```json
{
  "query": "контрагент не оплатил поставку",
  "limit": 20,
  "min_score": 0.5,
  "filters": {
    "date_from": "2020-01-01",
    "date_to": "2025-12-31",
    "court": "Арбитражный суд города Москвы",
    "doctype": "Решение",
    "categories": [
      "Споры, связанные с жилищными отношениями",
      "Другие жилищные споры"
    ]
  }
}
```

#### Формат ответа:
```json
{
  "query": "контрагент не оплатил поставку",
  "took_ms": 234,
  "items": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "case_number": "A40-12345/2023",
      "court_name": "Арбитражный суд города Москвы",
      "doc_date": "2023-05-15T00:00:00Z",
      "score": 0.87,
      "snippet": "...релевантный фрагмент текста...",
      "highlights": ["фрагмент 1", "фрагмент 2"],
      "url": "/cases/A40-12345-2023",
      "doctype": "Решение",
      "categories": ["Экономические споры", "Неисполнение договора"]
    }
  ]
}
```

## Созданная документация

### Файлы предложения (OpenSpec)

1. **`proposal.md`** - описание проблемы и изменений
2. **`tasks.md`** - чек-лист задач для имплементации (15 пунктов)
3. **`design.md`** - техническое обоснование и архитектурные решения
4. **`specs/semantic-search/spec.md`** - спецификация требований (5 requirements, 15 scenarios)

### Требования (Requirements)

1. **API Connection Configuration** - правильный URL и HTTPS
2. **Filters Support** - поддержка всех фильтров включая categories
3. **Response Handling** - корректная обработка ответов и ошибок
4. **Type Safety** - TypeScript типы для всех структур
5. **Documentation** - документация в README и комментариях

## Валидация

✅ Предложение прошло валидацию OpenSpec:
```bash
openspec validate fix-semantic-search-api --strict
# Change 'fix-semantic-search-api' is valid
```

## Следующие шаги

### Для реализации (после утверждения предложения):

1. **Обновить URL в коде:**
   - `services/api.ts` - изменить `semanticApiBase`
   - `server.js` - изменить `SEMANTIC_API_BASE`
   - `.env` файлы на сервере

2. **Добавить поддержку categories:**
   - Добавить в `SearchFilters` интерфейс
   - Добавить в `SearchResultItem` интерфейс
   - Обновить `adaptSearchResultToCaseRecord`

3. **Протестировать:**
   - Подключение к API
   - Поиск без фильтров
   - Поиск с фильтрами
   - Обработку ошибок

4. **Обновить документацию:**
   - README.md
   - Комментарии в коде

### Для добавления UI (отдельное предложение):
- Добавить селектор категорий в FilterPanel
- Интегрировать с семантическим поиском
- Получить список доступных категорий из API

## Полезные команды

```bash
# Просмотреть предложение
openspec show fix-semantic-search-api

# Проверить валидность
openspec validate fix-semantic-search-api --strict

# Начать имплементацию (после утверждения)
cat openspec/changes/fix-semantic-search-api/tasks.md

# Проверить здоровье API
curl -k https://semsearch.ru/health

# Тестовый поиск
curl -k -X POST https://semsearch.ru/api/v1/search \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"query": "тест", "limit": 5}'
```

## Различия между классическим и семантическим поиском

| Параметр | Классический API | Семантический API |
|----------|-----------------|-------------------|
| URL | `https://api.you-right.ru/gas` | `https://semsearch.ru/` |
| Метод поиска | По ключевым словам | По смыслу запроса |
| Фильтры в API | Нет (только на клиенте) | date_from, date_to, court, doctype, categories |
| Фильтры только UI | judge, side, level, inForceOnly | Нет |
| Score | Нет | Да (0.0-1.0) |
| Highlights | Нет | Да |
| Max results | ~30 | 1-100 (настраивается) |

## Важные замечания

⚠️ **Не смешивайте фильтры!**
- Фильтры для семантического API: date_from, date_to, court, doctype, categories
- Фильтры только для клиентской фильтрации: judge, result, side, level, inForceOnly

⚠️ **Формат дат:**
- Семантический API требует ISO 8601: `YYYY-MM-DD`
- Текущий код использует: `dd.mm.yyyy`
- Нужна конвертация!

⚠️ **Categories - новая возможность!**
- API возвращает категории для каждого дела
- Можно фильтровать по нескольким категориям (OR условие)
- Примеры: "Экономические споры", "Споры о правах на недвижимость"
