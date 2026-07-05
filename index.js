const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = process.env.X_URL || 'https://x.com/AndrejK40133234';
const TELEGRAM_GROUP_URL = process.env.TELEGRAM_GROUP_URL || '';
const TELEGRAM_CHANNEL_URL = process.env.TELEGRAM_CHANNEL_URL || '';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const sessions = new Map();

const isAdmin = (userId) => ADMIN_IDS.includes(String(userId));
const isPrivate = (msgOrQuery) => {
  const chat = msgOrQuery.message ? msgOrQuery.message.chat : msgOrQuery.chat;
  return chat && chat.type === 'private';
};

function kb(rows) {
  return { inline_keyboard: rows };
}

function homeKeyboard(userId) {
  const rows = [
    [{ text: '📊 Market', callback_data: 'market' }, { text: '📚 Project', callback_data: 'project' }],
    [{ text: '🌍 Community', callback_data: 'community' }, { text: '❓ FAQ', callback_data: 'faq' }],
    [{ text: '❌ Close', callback_data: 'close' }]
  ];
  if (isAdmin(userId)) rows.splice(2, 0, [{ text: '🔒 Admin Panel', callback_data: 'admin' }]);
  return kb(rows);
}

const text = {
  home: `🚀 *TRINTOPE*\n\nOfficial Project Bot\n\n🟢 Status: *Building*\n\nChoose a section below.`,
  market: `📊 *Market*\n\nToken is not live yet.\n\nPrice, chart and buy links will be available after launch.`,
  price: `💰 *Price*\n\nToken is not live yet.\nPrice tracking will become available after launch.`,
  chart: `📈 *Chart*\n\nChart will be available after launch.`,
  buy: `🛒 *Buy*\n\nTrading is not available yet.\nStay tuned.`,
  project: `📚 *Project*\n\nExplore TRINTOPE roadmap, tokenomics and news.`,
  news: `📢 *News*\n\nNo announcements yet.\nFollow X for updates.`,
  roadmap: `🗺 *Roadmap*\n\n✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n⬜ CEX Listing`,
  tokenomics: `💎 *Tokenomics*\n\nComing soon.\nTokenomics will be published before launch.`,
  faq: `❓ *FAQ*\n\n*What is TRINTOPE?*\nA community-driven Web3 project.\n\n*When launch?*\nThe launch date will be announced soon.\n\n*Where can I buy?*\nThe buy link will be available after launch.`,
  community: `🌍 *Community*\n\nUse only official TRINTOPE links.`,
  admin: `🔒 *Admin Panel*\n\nAccess granted.\n\nThis panel is visible only to ADMIN_IDS and works only in private chat.`,
  adminStub: `⚙️ *Admin Tool*\n\nThis section is prepared. Next version will allow editing content directly from Telegram.`
};

const keyboards = {
  market: kb([
    [{ text: '💰 Price', callback_data: 'price' }, { text: '📈 Chart', callback_data: 'chart' }],
    [{ text: '🛒 Buy', callback_data: 'buy' }],
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]),
  project: kb([
    [{ text: '📢 News', callback_data: 'news' }, { text: '🗺 Roadmap', callback_data: 'roadmap' }],
    [{ text: '💎 Tokenomics', callback_data: 'tokenomics' }],
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]),
  community: kb([
    [{ text: '🌐 Website', url: WEBSITE_URL }, { text: '🐦 X', url: X_URL }],
    ...(TELEGRAM_GROUP_URL ? [[{ text: '💬 Group', url: TELEGRAM_GROUP_URL }]] : []),
    ...(TELEGRAM_CHANNEL_URL ? [[{ text: '📢 Channel', url: TELEGRAM_CHANNEL_URL }]] : []),
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]),
  admin: kb([
    [{ text: '📢 Publish News', callback_data: 'admin_stub' }, { text: '🟢 Status', callback_data: 'admin_stub' }],
    [{ text: '🔗 Links', callback_data: 'admin_stub' }, { text: '📊 Stats', callback_data: 'admin_stub' }],
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]),
  back: kb([[{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]])
};

function remember(chatId, messageId) {
  const old = sessions.get(chatId);
  if (old && old !== messageId) bot.deleteMessage(chatId, old).catch(() => {});
  sessions.set(chatId, messageId);
  setTimeout(() => {
    if (sessions.get(chatId) === messageId) {
      bot.deleteMessage(chatId, messageId).catch(() => {});
      sessions.delete(chatId);
    }
  }, 5 * 60 * 1000);
}

async function sendOrEdit(chatId, messageId, body, keyboard, userId) {
  const options = { parse_mode: 'Markdown', reply_markup: keyboard || homeKeyboard(userId) };
  if (messageId) {
    return bot.editMessageText(body, { chat_id: chatId, message_id: messageId, ...options }).catch(async () => {
      const sent = await bot.sendMessage(chatId, body, options);
      remember(chatId, sent.message_id);
      return sent;
    });
  }
  const sent = await bot.sendMessage(chatId, body, options);
  remember(chatId, sent.message_id);
  return sent;
}

async function groupRedirect(msg) {
  const chatId = msg.chat.id;
  bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  const me = await bot.getMe();
  const sent = await bot.sendMessage(chatId, '🔒 Open the official TRINTOPE Bot in private chat.', {
    reply_markup: kb([[{ text: '🚀 Open TRINTOPE Bot', url: `https://t.me/${me.username}` }]])
  }).catch(() => null);
  if (sent) setTimeout(() => bot.deleteMessage(chatId, sent.message_id).catch(() => {}), 15000);
}

bot.onText(/\/start/, async (msg) => {
  if (msg.chat.type !== 'private') return groupRedirect(msg);
  await sendOrEdit(msg.chat.id, null, text.home, homeKeyboard(msg.from.id), msg.from.id);
});

bot.onText(/\/help/, async (msg) => {
  if (msg.chat.type !== 'private') return groupRedirect(msg);
  await sendOrEdit(msg.chat.id, null, text.home, homeKeyboard(msg.from.id), msg.from.id);
});

bot.onText(/\/id/, async (msg) => {
  if (msg.chat.type !== 'private') return groupRedirect(msg);
  await bot.sendMessage(msg.chat.id, `Your Telegram ID: ${msg.from.id}`);
});

bot.on('message', async (msg) => {
  if (msg.chat.type !== 'private' && msg.text && msg.text.startsWith('/')) return groupRedirect(msg);
});

bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const userId = q.from.id;
  if (q.message.chat.type !== 'private') {
    await bot.answerCallbackQuery(q.id, { text: 'Open the bot in private chat.' });
    return;
  }
  await bot.answerCallbackQuery(q.id).catch(() => {});
  if (q.data === 'close') {
    await bot.deleteMessage(chatId, q.message.message_id).catch(() => {});
    sessions.delete(chatId);
    return;
  }
  if (q.data === 'home') return sendOrEdit(chatId, q.message.message_id, text.home, homeKeyboard(userId), userId);
  if (q.data === 'market') return sendOrEdit(chatId, q.message.message_id, text.market, keyboards.market, userId);
  if (q.data === 'project') return sendOrEdit(chatId, q.message.message_id, text.project, keyboards.project, userId);
  if (q.data === 'community') return sendOrEdit(chatId, q.message.message_id, text.community, keyboards.community, userId);
  if (q.data === 'admin') {
    if (!isAdmin(userId)) return sendOrEdit(chatId, q.message.message_id, 'Access denied.', keyboards.back, userId);
    return sendOrEdit(chatId, q.message.message_id, text.admin, keyboards.admin, userId);
  }
  if (q.data === 'admin_stub') return sendOrEdit(chatId, q.message.message_id, text.adminStub, keyboards.admin, userId);
  const simplePages = ['price', 'chart', 'buy', 'news', 'roadmap', 'tokenomics', 'faq'];
  if (simplePages.includes(q.data)) return sendOrEdit(chatId, q.message.message_id, text[q.data], keyboards.back, userId);
});

bot.on('polling_error', (err) => console.error('Polling error:', err.message));
console.log('TRINTOPE Bot Core is running');
