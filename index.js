const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const PROJECT_NAME = process.env.PROJECT_NAME || 'TRINTOPE';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = process.env.X_URL || 'https://x.com/AndrejK40133234';
const CHART_URL = process.env.CHART_URL || '';
const BUY_URL = process.env.BUY_URL || '';
const TELEGRAM_GROUP_URL = process.env.TELEGRAM_GROUP_URL || '';
const TELEGRAM_CHANNEL_URL = process.env.TELEGRAM_CHANNEL_URL || '';
const STATUS = process.env.PROJECT_STATUS || 'Building';
const GROUP_SILENT_MODE = (process.env.GROUP_SILENT_MODE || 'true').toLowerCase() !== 'false';

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is missing. Add BOT_TOKEN in Railway Variables.');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function isGroup(chat) {
  return chat && (chat.type === 'group' || chat.type === 'supergroup');
}

async function safeDelete(chatId, messageId) {
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (err) {
    console.log('Could not delete message:', err.response?.body?.description || err.message);
  }
}

function mainMenuKeyboard() {
  const rows = [
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
  ];

  return { inline_keyboard: rows };
}

function homeText() {
  return `🚀 Welcome to ${PROJECT_NAME}\n\nOfficial Project Bot\n\n🟢 Status: ${STATUS}\n\nChoose an option below 👇`;
}

const sections = {
  price: `💰 Price\n\nToken is not live yet.\n\nPrice tracking will become available after launch.`,
  chart: CHART_URL
    ? `📈 Chart\n\n${CHART_URL}`
    : `📈 Chart\n\nChart will be available after launch.`,
  buy: BUY_URL
    ? `🛒 Buy\n\n${BUY_URL}`
    : `🛒 Buy\n\nTrading is not available yet.\n\nStay tuned for the official launch.`,
  help: `❓ Help\n\nThis is the official ${PROJECT_NAME} bot.\n\nUse it to access official project links, future token information, chart, buy links and updates.`,
  links: `🔗 Official Links\n\n🌐 Website:\n${WEBSITE_URL}\n\n🐦 X:\n${X_URL}${TELEGRAM_GROUP_URL ? `\n\n💬 Telegram Group:\n${TELEGRAM_GROUP_URL}` : ''}${TELEGRAM_CHANNEL_URL ? `\n\n📢 Telegram Channel:\n${TELEGRAM_CHANNEL_URL}` : ''}\n\nAlways use only official links.`
};

async function sendPrivateMenu(userId) {
  return bot.sendMessage(userId, homeText(), {
    reply_markup: mainMenuKeyboard(),
    disable_web_page_preview: true
  });
}

async function sendPrivateSection(userId, key) {
  const text = sections[key] || homeText();
  return bot.sendMessage(userId, text, {
    reply_markup: mainMenuKeyboard(),
    disable_web_page_preview: true
  });
}

async function handleGroupMessage(msg) {
  if (!GROUP_SILENT_MODE) return false;

  const chatId = msg.chat.id;
  const text = msg.text || '';
  const isCommand = text.startsWith('/');

  if (isCommand) {
    await safeDelete(chatId, msg.message_id);

    // Try to move the user to private chat without posting anything in the group.
    // This will only work if the user has already opened the bot before.
    try {
      await sendPrivateMenu(msg.from.id);
    } catch (err) {
      console.log('Private message not sent. User probably has not started the bot yet:', err.response?.body?.description || err.message);
    }

    return true;
  }

  return false;
}

bot.onText(/\/start(?:@\w+)?/i, async (msg) => {
  if (isGroup(msg.chat)) {
    await handleGroupMessage(msg);
    return;
  }

  await sendPrivateMenu(msg.chat.id);
});

bot.onText(/\/price(?:@\w+)?/i, async (msg) => {
  if (isGroup(msg.chat)) {
    await handleGroupMessage(msg);
    return;
  }
  await sendPrivateSection(msg.chat.id, 'price');
});

bot.onText(/\/chart(?:@\w+)?/i, async (msg) => {
  if (isGroup(msg.chat)) {
    await handleGroupMessage(msg);
    return;
  }
  await sendPrivateSection(msg.chat.id, 'chart');
});

bot.onText(/\/buy(?:@\w+)?/i, async (msg) => {
  if (isGroup(msg.chat)) {
    await handleGroupMessage(msg);
    return;
  }
  await sendPrivateSection(msg.chat.id, 'buy');
});

bot.onText(/\/links(?:@\w+)?/i, async (msg) => {
  if (isGroup(msg.chat)) {
    await handleGroupMessage(msg);
    return;
  }
  await sendPrivateSection(msg.chat.id, 'links');
});

bot.onText(/\/help(?:@\w+)?/i, async (msg) => {
  if (isGroup(msg.chat)) {
    await handleGroupMessage(msg);
    return;
  }
  await sendPrivateSection(msg.chat.id, 'help');
});

bot.on('callback_query', async (query) => {
  const msg = query.message;
  const data = query.data;

  if (msg && isGroup(msg.chat)) {
    // If someone presses buttons on an old menu that exists in the group,
    // remove that old menu and move the user to private chat silently.
    await safeDelete(msg.chat.id, msg.message_id);

    try {
      await sendPrivateSection(query.from.id, data);
      await bot.answerCallbackQuery(query.id, { text: 'Opened in private chat.' });
    } catch (err) {
      await bot.answerCallbackQuery(query.id, {
        text: 'Open the bot in private chat first.',
        show_alert: true
      });
    }
    return;
  }

  try {
    const text = sections[data] || homeText();
    await bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: mainMenuKeyboard(),
      disable_web_page_preview: true
    });
    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    await bot.answerCallbackQuery(query.id);
    console.log('Callback error:', err.response?.body?.description || err.message);
  }
});

bot.on('message', async (msg) => {
  if (isGroup(msg.chat)) {
    await handleGroupMessage(msg);
  }
});

bot.on('polling_error', (err) => {
  console.log('Polling error:', err.message);
});

console.log(`${PROJECT_NAME} bot v2.3 is running. Group silent mode: ${GROUP_SILENT_MODE}`);
