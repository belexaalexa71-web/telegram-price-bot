# TRINTOPE Telegram Bot v6

Clean official Telegram bot for TRINTOPE.

## Features

- One-message navigation: buttons edit the same message.
- Clean chat: old bot menu is deleted when a new one opens.
- Auto-cleanup: menu disappears after inactivity.
- Close button.
- Prepared sections: Market, Community, Project, More.
- Prepared admin panel placeholder.
- Deletes user commands in groups if the bot has Delete messages permission.

## Railway variables

Required:

```env
BOT_TOKEN=your_token_from_BotFather
```

Recommended:

```env
PROJECT_NAME=TRINTOPE
WEBSITE_URL=https://ea32b09e.trintope-universe.pages.dev/
X_URL=https://x.com/AndrejK40133234
MENU_TTL_MS=120000
```

Optional for later:

```env
TELEGRAM_URL=
CHART_URL=
BUY_URL=
ADMIN_ID=
```

## BotFather commands

Recommended minimal commands:

```text
start - Open menu
help - Help
```

## Group permissions

To delete user commands in a group:

1. Open the Telegram group.
2. Open group info.
3. Administrators.
4. Add Admin.
5. Select the bot.
6. Enable Delete messages.
7. Save.

The bot does not need ban/admin rights unless you want moderation.
