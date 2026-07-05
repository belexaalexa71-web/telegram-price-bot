# TRINTOPE Bot Dev v1

Real modular Node.js + Telegraf Telegram bot.

## Required Railway variables

- `BOT_TOKEN`
- `OWNER_SETUP_CODE`

Optional:
- `MENU_TTL_MS`
- `WEBSITE_URL`
- `X_URL`

## Owner setup

In private chat:

```text
/setup_owner YOUR_SECRET_CODE
```

Then:

```text
/start
```

## Admin edit commands

Only owner, private chat:

```text
/set_website https://example.com
/set_x https://x.com/...
/set_news text
/set_roadmap text
/set_tokenomics text
/set_faq text
```

## Notes

Data is stored in `data.json`. Next step: PostgreSQL.
