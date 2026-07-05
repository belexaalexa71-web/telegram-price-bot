# TRINTOPE Telegram Bot

## Features
- Group stays clean: commands are deleted if the bot has Delete Messages permission.
- In groups, users get only a short prompt to open the private bot.
- Full menu works in private chat only.
- One-message navigation with Back and Close.
- Auto-delete inactive menu after 3 minutes.
- Admin panel visible only to IDs in `ADMIN_IDS`.

## Railway variables
Required:
- `BOT_TOKEN`
- `ADMIN_IDS`

Optional:
- `WEBSITE_URL`
- `X_URL`
- `PROJECT_STATUS`

## Telegram group permissions
Give the bot admin permission: Delete messages.
No ban or invite permissions are required for this version.
