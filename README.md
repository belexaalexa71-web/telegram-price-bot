# TRINTOPE Bot Refactor v0.1.1

This update is a real refactor: admin logic has been moved out of the callback handler into dedicated admin modules.

## What changed

- `src/admin/panel.js` now contains Control Center text and admin actions.
- `src/admin/router.js` now routes admin button callbacks.
- `src/handlers/callback.js` is cleaner and only handles public navigation plus handoff to admin router.
- No empty admin folder.
- Existing behavior should remain the same.

## Required Railway variables

- `BOT_TOKEN`
- `OWNER_SETUP_CODE`

## Test after deploy

1. Private chat: `/start`
2. Open `Control Center`
3. Check `Status`, `Links`, `Stats`, `Logs`
4. Group: send `/start` and confirm it stays clean

## Version

`0.1.1`
