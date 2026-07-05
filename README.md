# TRINTOPE Bot Real v2

Рабочий модульный Telegram-бот на Node.js + Telegraf.

## Railway variables
- BOT_TOKEN — токен BotFather
- OWNER_SETUP_CODE — секрет для первой регистрации владельца
- ADMIN_IDS — можно оставить пустым после setup_owner, либо указать Telegram ID через запятую
- WEBSITE_URL — необязательно
- X_URL — необязательно
- MENU_TTL_MS — необязательно

## Commands
- /start — открыть меню
- /id — узнать Telegram ID
- /setup_owner CODE — первая регистрация владельца

## Owner edit commands
- /set_website URL
- /set_x URL
- /set_news text
- /set_roadmap text
- /set_tokenomics text
- /set_faq text
