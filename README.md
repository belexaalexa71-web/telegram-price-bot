# TRINTOPE Bot Security Core v1

## Что есть внутри

- Личное меню бота.
- В группе меню не показывается.
- Команды в группе удаляются, если у бота есть право Delete messages.
- Кнопка Open Bot для перехода в личку.
- Owner setup через OWNER_SETUP_CODE.
- Admin Panel только для владельца / админов.
- Stats, Status, Links, Logs.

## Railway variables

Required:

```env
BOT_TOKEN=your_bot_token
```

Recommended:

```env
OWNER_SETUP_CODE=your_secret_owner_code
ADMIN_IDS=your_telegram_id
```

## Owner setup

В личке с ботом:

```text
/setup_owner YOUR_SECRET_CODE
```

После этого отправь:

```text
/start
```

## Команды

```text
/start
/help
/id
/setup_owner SECRET
```
