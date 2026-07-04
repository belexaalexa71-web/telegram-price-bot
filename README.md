# TRINTOPE Bot — Secure Admin Panel

## Railway variables

Required:

- `BOT_TOKEN` — token from BotFather
- `ADMIN_IDS` — your Telegram ID. Example: `123456789`

To get your Telegram ID, send `/id` to the bot after deployment.

## Admin security

- Admin panel is visible only to IDs listed in `ADMIN_IDS`.
- Admin commands work only in private chat.
- Group commands can be deleted if the bot has admin permission: Delete messages.

## Admin commands

Use only in private chat with bot:

- `/setstatus Building`
- `/setwebsite https://example.com`
- `/setx https://x.com/example`
- `/settelegram https://t.me/example`
- `/setnews Your announcement`
- `/setroadmap Your roadmap`
- `/settokenomics Your tokenomics`

## Public commands

- `/start`
- `/help`
- `/id`
