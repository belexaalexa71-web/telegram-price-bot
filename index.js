const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('BOT_TOKEN is missing. Add it in Railway Variables.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const PROJECT_NAME = process.env.PROJECT_NAME || 'TRINTOPE';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = process.env.X_URL || 'https://x.com/AndrejK40133234';

// If true, bot replies in groups will be removed after BOT_REPLY_DELETE_SECONDS.
// This keeps the group clean. Private chat messages are never auto-deleted.
const DELETE_BOT_REPLIES_IN_GROUPS = (process.env.DELETE_BOT_REPLIES_IN_GROUPS || 'true').toLowerCase() === 'true';
const BOT_REPLY_DELETE_SECONDS = Number(process.env.BOT_REPLY_DELETE_SECONDS || 45);

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

function isGroupChat(chat) {
  return chat && (chat.type === 'group' || chat.type === 'supergroup');
}

function isSlashCommand(msg) {
  return Boolean(msg && msg.text && msg.text.trim().startsWith('/'));
}

async function deleteUserCommand(msg) {
  if (!isGroupChat(msg.chat) || !isSlashCommand(msg)) return;

  try {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
    console.log(`Deleted user command: ${msg.text}`);
  } catch (error) {
    console.log(`Could not delete user command. Make sure bot is admin with Delete messages permission. Error: ${error.message}`);
  }
}

function scheduleDeleteBotReply(chat, sentMessage) {
  if (!DELETE_BOT_REPLIES_IN_GROUPS) return;
  if (!isGroupChat(chat)) return;
  if (!sentMessage || !sentMessage.message_id) return;

  setTimeout(async () => {
    try {
      await bot.deleteMessage(chat.id, sentMessage.message_id);
      console.log(`Deleted bot reply: ${sentMessage.message_id}`);
    } catch (error) {
      console.log(`Could not delete bot reply. Error: ${error.message}`);
    }
  }, BOT_REPLY_DELETE_SECONDS * 1000);
}

async function sendCleanMessage(chat, text, options = mainMenu) {
  const sent = await bot.sendMessage(chat.id, text, options);
  scheduleDeleteBotReply(chat, sent);
  return sent;
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

async function handleCommand(msg, responseText) {
  await deleteUserCommand(msg);
  return sendCleanMessage(msg.chat, responseText, mainMenu);
}

bot.onText(/\/start(@\w+)?/, async (msg) => {
  await handleCommand(msg, homeText());
});

bot.onText(/\/help(@\w+)?/, async (msg) => {
  await handleCommand(msg, helpText());
});

bot.onText(/\/price(@\w+)?/, async (msg) => {
  await handleCommand(msg, '💰 <b>Price</b>\n\nToken is not live yet.\n\nPrice tracking will become available after launch.');
});

bot.onText(/\/chart(@\w+)?/, async (msg) => {
  await handleCommand(msg, '📈 <b>Chart</b>\n\nChart will be available after launch.');
});

bot.onText(/\/buy(@\w+)?/, async (msg) => {
  await handleCommand(msg, '🛒 <b>Buy</b>\n\nTrading is not available yet.\n\nStay tuned for the official launch.');
});

bot.onText(/\/links(@\w+)?/, async (msg) => {
  await handleCommand(msg, linksText());
});

// Catch unknown slash commands in groups and delete them too.
bot.on('message', async (msg) => {
  if (!isSlashCommand(msg)) return;

  const knownCommands = ['/start', '/help', '/price', '/chart', '/buy', '/links'];
  const command = msg.text.split(' ')[0].split('@')[0];

  if (!knownCommands.includes(command)) {
    await deleteUserCommand(msg);
  }
});

bot.on('callback_query', async (query) => {
  const chat = query.message.chat;
  const data = query.data;

  try {
    await bot.answerCallbackQuery(query.id);

    if (data === 'price') {
      return sendCleanMessage(chat, '💰 <b>Price</b>\n\nToken is not live yet.\n\nPrice tracking will become available after launch.', mainMenu);
    }

    if (data === 'chart') {
      return sendCleanMessage(chat, '📈 <b>Chart</b>\n\nChart will be available after launch.', mainMenu);
    }

    if (data === 'buy') {
      return sendCleanMessage(chat, '🛒 <b>Buy</b>\n\nTrading is not available yet.\n\nStay tuned for the official launch.', mainMenu);
    }

    if (data === 'help') {
      return sendCleanMessage(chat, helpText(), mainMenu);
    }

    if (data === 'links') {
      return sendCleanMessage(chat, linksText(), mainMenu);
    }
  } catch (error) {
    console.error('Callback error:', error.message);
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log(`${PROJECT_NAME} bot is running... Clean group mode: ${DELETE_BOT_REPLIES_IN_GROUPS}`);
