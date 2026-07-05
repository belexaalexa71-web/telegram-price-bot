# TRINTOPE Telegram Bot v3.0 Final Fixed

This is the stable TRINTOPE bot version.

## What is included

- Private user menu
- Silent group behavior
- `/myid`
- `/admin`
- Telegram admin panel
- Edit status, contract, chain, website, X, buy link, chart link, news, roadmap, tokenomics, FAQ
- Broadcast to bot users
- User statistics
- Postgres support through Railway `DATABASE_URL`
- Local fallback store if database is unavailable

## Railway variables

Required:

```text
BOT_TOKEN=your BotFather token
OWNER_ID=your Telegram numeric ID
```

Optional:

```text
ADMIN_IDS=123456789,987654321
GROUP_SILENT_MODE=true
DATABASE_URL=Railway Postgres URL
```

## Admin commands

```text
/myid
/admin
/settings
/setcontract <contract>
/setchain <network>
/setbuy <url>
/setchart <url>
/setwebsite <url>
/setx <url>
/setstatus <status>
/setnews <text>
```

## Important

In Telegram group settings, give the bot admin permission:

```text
Delete messages / Удалять сообщения
```

This lets the bot remove group commands and keep the main group clean.

## Expected Railway log

```text
TRINTOPE Bot v3.0.0-final-fixed is running.
```
