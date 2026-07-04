# TRINTOPE Telegram Bot v3

Clean official Telegram bot for the TRINTOPE project.

## What is new

- One clean editable menu
- Buttons do not create new messages
- When a user presses a button, the same bot message changes
- When a user sends `/start`, `/price`, `/chart`, `/buy`, `/links`, or `/help`, the previous bot message is removed
- In groups, user command messages can also be deleted if the bot is admin with permission to delete messages

## Environment variables

Required:

```
BOT_TOKEN=your_token_from_BotFather
```

Optional:

```
WEBSITE_URL=https://ea32b09e.trintope-universe.pages.dev/
X_URL=https://x.com/AndrejK40133234
PROJECT_STATUS=Building
```

## Run

```
npm install
npm start
```
