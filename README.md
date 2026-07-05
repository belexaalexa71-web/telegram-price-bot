# TRINTOPE Bot Owner Setup v4

## Railway variables

Required:

- BOT_TOKEN
- OWNER_SETUP_CODE

Recommended:

- BOT_USERNAME
- WEBSITE_URL
- X_URL

Optional fallback:

- ADMIN_IDS

## First owner setup

1. Add `OWNER_SETUP_CODE` in Railway Variables.
2. Redeploy.
3. In private chat with bot, send:

```text
/setup_owner YOUR_SECRET_CODE
```

After success, Admin Panel appears only for your Telegram ID.

## Admin commands

Private chat only:

```text
/set_status Building
/set_news Your announcement
/set_website https://...
/set_x https://x.com/...
```

## Group behavior

The bot removes commands in groups if it has Delete Messages permission and sends users to private chat.
