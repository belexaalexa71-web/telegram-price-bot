# TRINTOPE Bot v0.2.0 — Database Foundation

## What changed

Added real PostgreSQL support.

### Added
- PostgreSQL connection via DATABASE_URL
- Automatic database initialization
- Tables: owners, users, settings, admin_logs, news
- Settings storage in database
- User statistics
- Admin logs
- Edit project links through Telegram
- Change project status through Telegram

### Not changed
- Core navigation
- Group/private behavior
- Owner protection concept

## Required Railway variables

- BOT_TOKEN
- OWNER_SETUP_CODE
- DATABASE_URL

Optional:
- ADMIN_IDS
- MENU_TTL_MS

## Test checklist

1. Railway logs show:
   - Connected to PostgreSQL
   - Database initialized
   - TRINTOPE Bot v0.2.0 launched
2. `/start` works in private chat
3. Control Center opens for owner
4. Status changes save to database
5. Links can be edited from Telegram
6. Stats shows user count
