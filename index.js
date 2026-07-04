const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing. Add it in Railway Variables.');
  process.exit(1);
}

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = process.env.X_URL || 'https://x.com/AndrejK40133234';
const PROJECT_STATUS = process.env.PROJECT_STATUS || 'Building';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Keeps only one active bot menu message per chat.
// For a bigger bot later, we can replace this memory store with a database.
const lastBotMessageByChat = new Map();

const mainKeyboard = {
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
      { text: '📢 News', callback_data: 'news' }
    ],
    [
      { text: '💎 Tokenomics', callback_data: 'tokenomics' },
      { text: '🗺 Roadmap', callback_data: 'roadmap' }
    ],
    [
      { text: '👥 Community', callback_data: 'community' },
      { text: '❓ Help', callback_data: 'help' }
    ]
  ]
};

const backKeyboard = {
  inline_keyboard: [[{ text: '⬅️ Back to menu', callback_data: 'home' }]]
};

function homeText() {
  return `🚀 *Welcome to TRINTOPE*\n\nOfficial Project Bot\n\n🟢 Status: *${PROJECT_STATUS}*\n\nChoose an option below 👇`;
}

const pages = {
  home: () => ({ text: homeText(), keyboard: mainKeyboard }),
  price: () => ({
    text: '💰 *Price*\n\nToken is not live yet.\n\nPrice tracking will become available after launch.',
    keyboard: backKeyboard
  }),
  chart: () => ({
    text: '📈 *Chart*\n\nChart will be available after launch.',
    keyboard: backKeyboard
  }),
  buy: () => ({
    text: '🛒 *Buy TRINTOPE*\n\nTrading is not available yet.\n\nStay tuned for the official launch.',
    keyboard: backKeyboard
  }),
  news: () => ({
    text: '📢 *News*\n\nNo announcements yet.\n\nFollow X for updates.',
    keyboard: backKeyboard
  }),
  tokenomics: () => ({
    text: '💎 *Tokenomics*\n\nComing soon.\n\nTokenomics will be published before launch.',
    keyboard: backKeyboard
  }),
  roadmap: () => ({
    text: '🗺 *Roadmap*\n\n✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n⬜ CEX Listing',
    keyboard: backKeyboard
  }),
  community: () => ({
    text: `👥 *Community*\n\n🌐 Website:\n${WEBSITE_URL}\n\n🐦 X:\n${X_URL}\n\nTelegram group and channel links will be added soon.`,
    keyboard: backKeyboard
  }),
  help: () => ({
    text: '❓ *Help*\n\nUse this bot to access official TRINTOPE resources:\n\n• Price\n• Chart\n• Buy link\n• Website\n• X\n• News\n• Roadmap\n• Tokenomics\n\nOnly trust links shown inside this official bot.',
    keyboard: backKeyboard
  })
};

async function deletePreviousBotMessage(chatId) {
  const lastMessageId = lastBotMessageByChat.get(chatId);
  if (!lastMessageId) return;

  try {
    await bot.deleteMessage(chatId, lastMessageId);
  } catch (error) {
    // It is okay if Telegram does not allow deleting an older message.
  }
}

async function deleteUserCommand(msg) {
  // In groups/supergroups this requires the bot to be admin with delete message permission.
  try {
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
      await bot.deleteMessage(msg.chat.id, msg.message_id);
    }
  } catch (error) {
    // If no admin rights, the command stays visible. The bot still works.
  }
}

async function sendCleanPage(chatId, pageName, msg = null) {
  const page = pages[pageName] ? pages[pageName]() : pages.home();

  await deletePreviousBotMessage(chatId);
  if (msg) await deleteUserCommand(msg);

  const sent = await bot.sendMessage(chatId, page.text, {
    parse_mode: 'Markdown',
    reply_markup: page.keyboard,
    disable_web_page_preview: true
  });

  lastBotMessageByChat.set(chatId, sent.message_id);
}

async function editPage(callbackQuery, pageName) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const page = pages[pageName] ? pages[pageName]() : pages.home();

  try {
    await bot.editMessageText(page.text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: page.keyboard,
      disable_web_page_preview: true
    });
    lastBotMessageByChat.set(chatId, messageId);
  } catch (error) {
    // If Telegram cannot edit, send a clean new page.
    await sendCleanPage(chatId, pageName);
  }

  await bot.answerCallbackQuery(callbackQuery.id);
}

bot.onText(/\/start/, (msg) => sendCleanPage(msg.chat.id, 'home', msg));
bot.onText(/\/help/, (msg) => sendCleanPage(msg.chat.id, 'help', msg));
bot.onText(/\/price/, (msg) => sendCleanPage(msg.chat.id, 'price', msg));
bot.onText(/\/chart/, (msg) => sendCleanPage(msg.chat.id, 'chart', msg));
bot.onText(/\/buy/, (msg) => sendCleanPage(msg.chat.id, 'buy', msg));
bot.onText(/\/links/, (msg) => sendCleanPage(msg.chat.id, 'community', msg));

bot.on('callback_query', (callbackQuery) => {
  const pageName = callbackQuery.data || 'home';
  editPage(callbackQuery, pageName);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('TRINTOPE bot v3 is running.');
