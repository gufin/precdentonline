# GitHub Secrets Configuration

Для работы автоматического деплоя через GitHub Actions необходимо настроить следующие секреты в репозитории.

## Необходимые Secrets

| Secret Name | Описание | Пример значения |
|------------|----------|-----------------|
| `FTP_HOST` | Адрес FTP сервера | `server295.hosting.reg.ru` |
| `FTP_USERNAME` | Имя пользователя FTP | `u1234567` |
| `FTP_PASSWORD` | Пароль FTP | `your_password_here` |
| `FTP_SERVER_DIR` | Директория на сервере (с завершающим слешем) | `/` |

## Инструкция по добавлению Secrets

### Шаг 1: Откройте настройки репозитория
1. Перейдите в ваш GitHub репозиторий
2. Кликните на **Settings** (Настройки)

### Шаг 2: Перейдите в раздел Secrets
1. В левом меню найдите **Secrets and variables**
2. Кликните на **Actions**

### Шаг 3: Добавьте каждый Secret
Для каждого секрета из таблицы выше:

1. Нажмите **New repository secret**
2. В поле **Name** введите имя секрета (например, `FTP_HOST`)
3. В поле **Secret** введите значение
4. Нажмите **Add secret**

### Шаг 4: Проверка
После добавления всех секретов вы должны увидеть 4 секрета в списке:
- ✅ FTP_HOST
- ✅ FTP_USERNAME
- ✅ FTP_PASSWORD
- ✅ FTP_SERVER_DIR

## Где взять значения?

Если у вас уже настроен локальный деплой, возьмите значения из файла `.env.deploy`:

```bash
# В корне проекта
cat .env.deploy
```

Вы увидите примерно такое содержимое:
```env
FTP_HOST=server295.hosting.reg.ru
FTP_USER=u1234567
FTP_PASSWORD=ваш_пароль
FTP_DIR=/
```

**Соответствие переменных:**
- `.env.deploy`: `FTP_HOST` → GitHub Secret: `FTP_HOST`
- `.env.deploy`: `FTP_USER` → GitHub Secret: `FTP_USERNAME`
- `.env.deploy`: `FTP_PASSWORD` → GitHub Secret: `FTP_PASSWORD`
- `.env.deploy`: `FTP_DIR` → GitHub Secret: `FTP_SERVER_DIR`

## Безопасность

⚠️ **Важно:**
- Никогда не коммитьте файл `.env.deploy` в Git
- Secrets шифруются GitHub и доступны только в workflows
- Secrets не отображаются в логах GitHub Actions
- Регулярно меняйте FTP пароль
- Репозиторий должен оставаться приватным для максимальной безопасности

## Проверка работы

После настройки secrets:
1. Сделайте любое изменение в проекте
2. Закоммитьте и запушьте в ветку `main`
3. Перейдите на вкладку **Actions** в GitHub
4. Вы должны увидеть запущенный workflow "Deploy to FTP"
5. Проверьте логи - деплой должен пройти успешно

Если возникли проблемы, см. [Troubleshooting](#troubleshooting) в README.md.
