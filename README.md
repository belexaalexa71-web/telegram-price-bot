# TRINTOPE Bot v0.2.1 — Better Admin UX

Stable Telegram Control Center with improved owner experience.

## What changed

- Control Center layout improved.
- Public status changes now require confirmation.
- Editing screen has Cancel button.
- Status uses clear icons.
- Admin logs are easier to read.
- Version updated to `0.2.1`.

## What did not change

- Core navigation.
- Owner protection.
- Group clean mode.
- PostgreSQL/data.json storage behavior.

## Required Railway variables

- `BOT_TOKEN`
- `OWNER_SETUP_CODE`
- `DATABASE_URL` recommended
- `ADMIN_IDS` optional fallback owner list
- `MENU_TTL_MS` optional

## Deploy

Upload the full project to GitHub and wait for Railway to redeploy.

Expected log:

```text
✅ TRINTOPE Bot v0.2.1 launched
```
