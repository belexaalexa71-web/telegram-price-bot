# TRINTOPE Bot v2.5 Admin Panel

## Railway variables
Required:
- `BOT_TOKEN` — token from BotFather
- `OWNER_ID` — your Telegram numeric ID

Get OWNER_ID by opening Telegram bot @userinfobot and copying your numeric ID.

## Owner commands in private chat
- `/admin` — open admin panel
- `/setstatus LIVE`
- `/setchain BSC`
- `/setcontract 0x...`
- `/setbuy https://...`
- `/setchart https://...`
- `/setnews Text`
- `/setwebsite https://...`
- `/setx https://x.com/...`
- `/settokenomics Text`
- `/setroadmap Text`
- `/setfaq Text`
- `/setsupport Text`

## Group behavior
- User commands in groups are deleted.
- Bot does not post public menus in the group.
- If the user already opened the bot, the menu is sent privately.
- If not, a temporary Open Bot button appears and is deleted after 8 seconds.

Bot needs admin right: Delete messages.
