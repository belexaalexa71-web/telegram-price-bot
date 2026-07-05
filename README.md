# TRINTOPE Bot Admin Edit v3

## Railway Variables
- BOT_TOKEN - token from BotFather
- ADMIN_IDS - your Telegram ID, or several IDs separated by comma
- BOT_USERNAME - bot username without @, optional but recommended for group button

## Admin commands in private chat
- /id
- /setwebsite https://...
- /setx https://x.com/...
- /setnews text
- /setroadmap text
- /settokenomics text
- /setfaq text

## Behavior
- In groups: commands are deleted and users are sent to private bot chat.
- In private: one-message menu with Back and Close.
- Admin panel only appears for IDs in ADMIN_IDS.
