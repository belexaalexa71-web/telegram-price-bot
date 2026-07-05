# TRINTOPE Bot v0.2.0 CMS Foundation

Stable core + Telegram Control Center.

## What changed

- Project settings can be edited directly from Telegram.
- Supports PostgreSQL through `DATABASE_URL`.
- Falls back to `data.json` if PostgreSQL is unavailable.
- Stores owners, users, settings and logs.
- Keeps groups clean: group commands are deleted and users are redirected to private chat.

## Required Railway variables

- `BOT_TOKEN`
- `OWNER_SETUP_CODE`
- `DATABASE_URL` recommended
- `ADMIN_IDS` optional fallback owner list
- `MENU_TTL_MS` optional

## Deploy

Upload the full project to GitHub and wait for Railway to redeploy.

Expected logs:

```text
✅ Connected to PostgreSQL
✅ Database initialized
✅ TRINTOPE Bot v0.2.0 launched
```

If PostgreSQL is not reachable, the bot will still run using `data.json`.
