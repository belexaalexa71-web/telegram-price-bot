# TRINTOPE Telegram Bot v2.4

This version keeps the group clean:

- Deletes user commands in groups.
- Does not post normal bot answers in groups.
- If the user has already opened the bot before, the menu is sent privately.
- If the user has not opened the bot before, Telegram blocks private messages. In that case the bot sends one silent temporary button: **Open TRINTOPE Bot**, then deletes it automatically.
- Uses `disable_notification: true` for the temporary group prompt.

## Required Railway variable

BOT_TOKEN=your_token_from_BotFather

## Optional variables

PROJECT_NAME=TRINTOPE
WEBSITE_URL=https://ea32b09e.trintope-universe.pages.dev/
X_URL=https://x.com/AndrejK40133234
PROJECT_STATUS=Building
GROUP_SILENT_MODE=true
GROUP_PROMPT_DELETE_SECONDS=8

## Important

In the Telegram group, the bot must be admin and must have permission:

- Delete messages / Удалять сообщения
