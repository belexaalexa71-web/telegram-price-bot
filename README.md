# TRINTOPE Telegram Bot v2.3

This version keeps the main Telegram group clean.

## What changed

- Commands in groups are deleted automatically.
- The bot does not post menu replies in the group.
- The bot tries to move users to private chat silently.
- If users press buttons from old group menus, the old menu is removed.
- All normal bot interaction happens in private messages.

## Required Railway variable

```env
BOT_TOKEN=your_token_from_BotFather
```

## Recommended Railway variables

```env
PROJECT_NAME=TRINTOPE
WEBSITE_URL=https://ea32b09e.trintope-universe.pages.dev/
X_URL=https://x.com/AndrejK40133234
PROJECT_STATUS=Building
GROUP_SILENT_MODE=true
```

Optional later:

```env
CHART_URL=
BUY_URL=
TELEGRAM_GROUP_URL=
TELEGRAM_CHANNEL_URL=
```

## Important Telegram permissions

In your Telegram group, the bot must be an admin with:

- Delete messages / Удалять сообщения

Without this permission Telegram will not allow the bot to delete group commands or old bot menus.
