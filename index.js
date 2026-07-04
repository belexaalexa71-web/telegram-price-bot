const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN. Add it as an environment variable.');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const PROJECT_NAME = process.env.PROJECT_NAME || 'My Token';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://your-website.com';
const X_URL = process.env.X_URL || 'https://x.com/your_project';
const CHART_URL = process.env.CHART_URL || 'Chart link will be added after launch.';

function sendSafe(chatId, text, options = {}) {
  return bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...options,
  });
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  sendSafe(chatId,
    `👋 Welcome to <b>${PROJECT_NAME}</b>!\n\n` +
    `Use these commands:\n` +
    `/about — About the project\n` +
    `/links — Official links\n` +
    `/price — Token price\n` +
    `/chart — Token chart\n` +
    `/help — Help`
  );
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  sendSafe(chatId,
    `🤖 <b>${PROJECT_NAME} Bot Commands</b>\n\n` +
    `/start — Start bot\n` +
    `/about — About the project\n` +
    `/links — Official links\n` +
    `/price — Token price\n` +
    `/chart — Token chart`
  );
});

bot.onText(/\/about/, (msg) => {
  const chatId = msg.chat.id;
  sendSafe(chatId,
    `ℹ️ <b>About ${PROJECT_NAME}</b>\n\n` +
    `This is the official Telegram bot for our project.\n` +
    `Token price, chart and updates will be added after launch.`
  );
});

bot.onText(/\/links/, (msg) => {
  const chatId = msg.chat.id;
  sendSafe(chatId,
    `🔗 <b>Official Links</b>\n\n` +
    `Website: ${WEBSITE_URL}\n` +
    `X/Twitter: ${X_URL}`
  );
});

bot.onText(/\/price/, (msg) => {
  const chatId = msg.chat.id;
  sendSafe(chatId,
    `💰 <b>${PROJECT_NAME} Price</b>\n\n` +
    `Price tracking will be connected after the token is launched and trading starts.`
  );
});

bot.onText(/\/chart/, (msg) => {
  const chatId = msg.chat.id;
  sendSafe(chatId,
    `📈 <b>${PROJECT_NAME} Chart</b>\n\n` +
    `${CHART_URL}`
  );
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log(`${PROJECT_NAME} bot is running...`);
