# TRINTOPE Bot — Control Center v1

## Railway variables

Required:

- `BOT_TOKEN` — token from BotFather
- `OWNER_SETUP_CODE` — secret code for first owner setup

Optional:

- `WEBSITE_URL` — default website
- `X_URL` — default X/Twitter link
- `MENU_TTL_MS` — auto-delete menu timeout, default `300000` (5 minutes)

## Owner setup

In private chat with the bot:

```text
/setup_owner YOUR_SECRET_CODE
```

After owner activation, `/start` will show **TRINTOPE Control Center** only to the owner.

## Group behavior

In groups, bot deletes slash commands when it has `Delete messages` permission and sends a short private-chat button.

## User behavior

Private chat uses one editable menu message. Commands are deleted where possible. Close deletes the menu.
