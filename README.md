# TRINTOPE Bot Clean UI v2

## What changed

- `/start`, `/help`, `/id`, `/setup_owner` are deleted after use when Telegram allows it.
- Private chat works like a clean mini-app.
- Group commands are deleted and users are redirected to private chat.
- One active menu message per chat.
- `Close` deletes the menu.
- Menus auto-delete after inactivity.
- Protected owner/admin panel.
- Admin can edit Website, X, News, Roadmap, Tokenomics, FAQ and Welcome text from Telegram.

## Railway variables

Required:

```env
BOT_TOKEN=your_bot_token
OWNER_SETUP_CODE=your_secret_setup_code
```

Optional:

```env
ADMIN_IDS=123456789
AUTO_DELETE_MS=600000
```

## Commands

```text
/start
/help
/id
/setup_owner YOUR_SECRET_CODE
```

Only `/start` is needed for normal users.
