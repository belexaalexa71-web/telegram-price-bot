# TRINTOPE Telegram Bot v2.2

This version keeps group chats cleaner:

- Deletes slash commands in groups, such as `/start`, `/price`, `/help`.
- Optionally auto-deletes the bot's own command replies in groups.
- Keeps normal private chat behavior unchanged.

## Required Railway variable

`BOT_TOKEN=your_token_from_BotFather`

## Optional Railway variables

`PROJECT_NAME=TRINTOPE`
`WEBSITE_URL=https://ea32b09e.trintope-universe.pages.dev/`
`X_URL=https://x.com/AndrejK40133234`
`DELETE_BOT_REPLIES_IN_GROUPS=true`
`BOT_REPLY_DELETE_SECONDS=45`

## Important

In Telegram group settings, the bot must be an admin with **Delete messages** permission.
