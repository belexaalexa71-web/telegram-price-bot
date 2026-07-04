# Token Price Telegram Bot

A simple Node.js Telegram bot for a crypto project.

## Commands

- `/start` — welcome message
- `/about` — about the project
- `/links` — official links
- `/price` — placeholder until token launch
- `/chart` — placeholder chart link
- `/help` — command list

## Environment variables

Required:

- `BOT_TOKEN` — your Telegram bot token from BotFather

Optional:

- `PROJECT_NAME` — your project name
- `WEBSITE_URL` — your website link
- `X_URL` — your X/Twitter link
- `CHART_URL` — chart link after launch

## Run locally

```bash
npm install
BOT_TOKEN="YOUR_TOKEN_HERE" npm start
```

Do not publish your bot token publicly.
