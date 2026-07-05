# TRINTOPE Bot Full DB v1

Features:
- Private chat menu with inline navigation
- Clean group mode: commands are deleted and users are sent to private chat
- Protected owner setup with OWNER_SETUP_CODE
- Control Center visible only to the owner
- Edit Website, X, Welcome, News, Roadmap, Tokenomics, FAQ from Telegram
- PostgreSQL support via Railway DATABASE_URL
- JSON fallback if DATABASE_URL is not configured

## Railway variables
Required:
- BOT_TOKEN
- OWNER_SETUP_CODE

Recommended:
- DATABASE_URL (Railway PostgreSQL provides this automatically)
- BOT_USERNAME
- MENU_TTL_MS

## Owner setup
In private chat:
`/setup_owner YOUR_SECRET_CODE`

Then send `/start`.
