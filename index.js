const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('BOT_TOKEN is missing. Add it in Railway Variables.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const PROJECT_NAME = 'TRINTOPE';
const WEBSITE_URL = 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = 'https://x.com/AndrejK40133234';

const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '💰 Price', callback_data: 'price' },
        { text: '📈 Chart', callback_data: 'chart' }
      ],
      [
        { text: '🛒 Buy', callback_data: 'buy' },
        { text: '🌐 Website', url: WEBSITE_URL }
      ],
      [
        { text: '🐦 X', url: X_URL },
        { text: '❓ Help', callback_data: 'help' }
      ],
      [
        { text: '🔗 Official Links', callback_data: 'links' }
      ]
    ]
  },
  parse_mode: 'HTML'
};

function isGroupChat(msg) {
  return msg.chat.type === 'group' || msg.chat.type === 'supergroup';
}

async function deleteCommandMessage(msg) {
  // Deletes the user's slash command in groups, so the chat stays clean.
  // The bot must be an admin with "Delete messages" permission.
  if (!isGroupChat(msg)) return;
  if (!msg.text || !msg.text.startsWith('/')) return;

  try {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
  } catch (error) {
    console.log('Could not delete command message:', error.message);
  }
}

function homeText() {
  return `🚀 <b>Welcome to ${PROJECT_NAME}</b>\n\nOfficial Project Bot\n\n🟢 <b>Status:</b> Building\n\nWelcome to the official ${PROJECT_NAME} ecosystem.\n\nChoose an option below 👇`;
}

function helpText() {
  return `❓ <b>Help</b>\n\nUse this bot to access official ${PROJECT_NAME} resources:\n\n• 💰 Price\n• 📈 Chart\n• 🛒 Buy link\n• 🌐 Website\n• 🐦 X\n• 🔗 Official links\n\nPrice, chart and buy links will become available after launch.`;
}

function linksText() {
  return `🔗 <b>Official Links</b>\n\n🌐 Website:\n${WEBSITE_URL}\n\n🐦 X:\n${X_URL}\n\nAlways use only official links.`;
}

function sendHome(chatId) {
  return bot.sendMessage(chatId, homeText(), mainMenu);
}

bot.onText(/\/start/, async (msg) => {
  await deleteCommandMessage(msg);
  sendHome(msg.chat.id);
});

bot.onText(/\/help/, async (msg) => {
  await deleteCommandMessage(msg);
  bot.sendMessage(msg.chat.id, helpText(), mainMenu);
});

bot.onText(/\/price/, async (msg) => {
  await deleteCommandMessage(msg);
  bot.sendMessage(msg.chat.id, '💰 <b>Price</b>\n\nToken is not live yet.\n\nPrice tracking will become available after launch.', mainMenu);
});

bot.onText(/\/chart/, async (msg) => {
  await deleteCommandMessage(msg);
  bot.sendMessage(msg.chat.id, '📈 <b>Chart</b>\n\nChart will be available after launch.', mainMenu);
});

bot.onText(/\/buy/, async (msg) => {
  await deleteCommandMessage(msg);
  bot.sendMessage(msg.chat.id, '🛒 <b>Buy</b>\n\nTrading is not available yet.\n\nStay tuned for the official launch.', mainMenu);
});

bot.onText(/\/links/, async (msg) => {
  await deleteCommandMessage(msg);
  bot.sendMessage(msg.chat.id, linksText(), mainMenu);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    await bot.answerCallbackQuery(query.id);

    if (data === 'price') {
      return bot.sendMessage(chatId, '💰 <b>Price</b>\n\nToken is not live yet.\n\nPrice tracking will become available after launch.', mainMenu);
    }

    if (data === 'chart') {
      return bot.sendMessage(chatId, '📈 <b>Chart</b>\n\nChart will be available after launch.', mainMenu);
    }

    if (data === 'buy') {
      return bot.sendMessage(chatId, '🛒 <b>Buy</b>\n\nTrading is not available yet.\n\nStay tuned for the official launch.', mainMenu);
    }

    if (data === 'help') {
      return bot.sendMessage(chatId, helpText(), mainMenu);
    }

    if (data === 'links') {
      return bot.sendMessage(chatId, linksText(), mainMenu);
    }
  } catch (error) {
    console.error('Callback error:', error.message);
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log(`${PROJECT_NAME} bot is running...`);
