# TRINTOPE Telegram Bot v3.0 Final

Финальная стабильная версия бота TRINTOPE после всех исправлений.

## Что умеет

- Работает в личке с пользователем.
- В группе удаляет команды и не засоряет чат.
- Если пользователь пишет команду в группе, бот пытается отправить меню в личку.
- Красивое меню с кнопками.
- Админ-панель `/admin` только для владельца/админов.
- Управление через Telegram без GitHub/Railway:
  - статус проекта;
  - контракт токена;
  - сеть;
  - сайт;
  - X;
  - Buy link;
  - Chart link;
  - новости;
  - roadmap;
  - tokenomics;
  - FAQ;
  - support;
  - community links;
  - broadcast всем пользователям.
- Команда `/myid` показывает Telegram ID.
- Команда `/setcontract CONTRACT` сохраняет контракт.

## Railway Variables

Обязательные:

```env
BOT_TOKEN=токен от BotFather
OWNER_ID=твой Telegram ID числом
```

Желательно:

```env
DATABASE_URL=PostgreSQL URL от Railway
```

Дополнительно:

```env
ADMIN_IDS=123,456,789
```

## Важно для группы

Чтобы бот удалял команды в группе, выдай ему права администратора:

- Delete messages / Удалять сообщения

## Проверка после загрузки

1. Railway должен показать в логах:

```text
TRINTOPE Bot v3.0.0-final is running
```

2. В личке бота:

```text
/start
/admin
/myid
```

3. В группе команда `/start` должна удаляться и не засорять чат.

## Как добавить контракт после запуска токена

В личке бота:

```text
/admin
```

Нажать `🪙 Contract` и отправить адрес контракта.

Или командой:

```text
/setcontract CONTRACT_ADDRESS
```

