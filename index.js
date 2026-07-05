const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_SETUP_CODE = process.env.OWNER_SETUP_CODE;
const ADMIN_IDS_ENV = process.env.ADMIN_IDS || '';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = process.env.X_URL || 'https://x.com/AndrejK40133234';
const BOT_USERNAME = process.env.BOT_USERNAME || '';
const DATA_FILE = path.join(__dirname, 'data.json');

if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN env variable');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const defaultData = {
  ownerIds: [],
  users: {},
  projectStatus: 'Building',
  news: 'No announcements yet. Follow X for updates.',
  roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
  tokenomics: 'Coming soon. Tokenomics will be published before launch.',
  faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen will the token launch?\nThe launch date will be announced soon.\n\nWhere can I buy it?\nThe buy link will be available after launch.',
  links: {
    website: WEBSITE_URL,
    x: X_URL
  }
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ...defaultData, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
    }
  } catch (e) {
    console.error('Failed to load data:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

let data = loadData();

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save data:', e.message);
  }
}

function envAdminIds() {
  return ADMIN_IDS_ENV.split(',').map(x => Number(String(x).trim())).filter(Boolean);
}

function isOwner(userId) {
  return data.ownerIds.includes(Number(userId)) || envAdminIds().includes(Number(userId));
}

function rememberUser(msg) {
  if (!msg.from) return;
  const id = String(msg.from.id);
  data.users[id] = {
    id: msg.from.id,
    username: msg.from.username || '',
    firstName: msg.from.first_name || '',
    lastSeen: new Date().toISOString()
  };
  saveData();
}

function isPrivate(msg) {
  return msg.chat && msg.chat.type === 'private';
}

async function safeDelete(chatId, messageId) {
  try { await bot.deleteMessage(chatId, messageId); } catch (_) {}
}

function homeKeyboard(userId) {
  const rows = [
    [{ text: '📊 Market', callback_data: 'market' }, { text: '📚 Project', callback_data: 'project' }],
    [{ text: '🌍 Community', callback_data: 'community' }, { text: '⚙️ More', callback_data: 'more' }],
  ];
  if (isOwner(userId)) rows.push([{ text: '🔒 Admin Panel', callback_data: 'admin' }]);
  rows.push([{ text: '❌ Close', callback_data: 'close' }]);
  return { inline_keyboard: rows };
}

function backKeyboard(section = 'home') {
  return { inline_keyboard: [[{ text: '⬅️ Back', callback_data: section }], [{ text: '❌ Close', callback_data: 'close' }]] };
}

function marketKeyboard() {
  return { inline_keyboard: [
    [{ text: '💰 Price', callback_data: 'price' }, { text: '📈 Chart', callback_data: 'chart' }],
    [{ text: '🛒 Buy', callback_data: 'buy' }],
    [{ text: '⬅️ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]};
}

function projectKeyboard() {
  return { inline_keyboard: [
    [{ text: '📢 News', callback_data: 'news' }, { text: '🗺 Roadmap', callback_data: 'roadmap' }],
    [{ text: '💎 Tokenomics', callback_data: 'tokenomics' }, { text: '❓ FAQ', callback_data: 'faq' }],
    [{ text: '⬅️ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]};
}

function communityKeyboard() {
  return { inline_keyboard: [
    [{ text: '🌐 Website', url: data.links.website || WEBSITE_URL }],
    [{ text: '🐦 X', url: data.links.x || X_URL }],
    [{ text: '⬅️ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]};
}

function adminKeyboard() {
  return { inline_keyboard: [
    [{ text: '📊 Stats', callback_data: 'admin_stats' }, { text: '🟢 Status', callback_data: 'admin_status' }],
    [{ text: '📢 News', callback_data: 'admin_news' }, { text: '🔗 Links', callback_data: 'admin_links' }],
    [{ text: '⬅️ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]};
}

function renderHome(userId) {
  return {
    text: `🚀 TRINTOPE\n\nOfficial Project Bot\n\n🟢 Status: ${data.projectStatus}\n\nChoose an option below 👇`,
    opts: { reply_markup: homeKeyboard(userId) }
  };
}

async function sendOrEdit(chatId, messageId, text, replyMarkup) {
  if (messageId) {
    try {
      return await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: replyMarkup, disable_web_page_preview: true });
    } catch (e) {
      if (!String(e.message).includes('message is not modified')) console.error('edit error:', e.message);
    }
  }
  return bot.sendMessage(chatId, text, { reply_markup: replyMarkup, disable_web_page_preview: true });
}

async function sendPrivateHome(chatId, userId) {
  const screen = renderHome(userId);
  return bot.sendMessage(chatId, screen.text, { reply_markup: screen.opts.reply_markup, disable_web_page_preview: true });
}

bot.onText(/^\/id$/, async (msg) => {
  rememberUser(msg);
  await bot.sendMessage(msg.chat.id, `Your Telegram ID:\n\n${msg.from.id}`);
});

bot.onText(/^\/setup_owner(?:\s+(.+))?$/, async (msg, match) => {
  rememberUser(msg);
  if (!isPrivate(msg)) {
    await safeDelete(msg.chat.id, msg.message_id);
    return;
  }
  const code = (match && match[1] ? match[1].trim() : '');
  if (!OWNER_SETUP_CODE) {
    return bot.sendMessage(msg.chat.id, 'OWNER_SETUP_CODE is not configured in Railway Variables.');
  }
  if (code !== OWNER_SETUP_CODE) {
    return bot.sendMessage(msg.chat.id, '❌ Wrong setup code.');
  }
  const id = Number(msg.from.id);
  if (!data.ownerIds.includes(id)) {
    data.ownerIds.push(id);
    saveData();
  }
  await bot.sendMessage(msg.chat.id, '✅ Owner access activated. Admin Panel is now available to you.');
  return sendPrivateHome(msg.chat.id, msg.from.id);
});

bot.onText(/^\/start|^\/help/, async (msg) => {
  rememberUser(msg);
  if (!isPrivate(msg)) {
    await safeDelete(msg.chat.id, msg.message_id);
    const username = BOT_USERNAME || (await bot.getMe()).username;
    const sent = await bot.sendMessage(msg.chat.id, '🔒 Open the official TRINTOPE Bot in private chat.', {
      reply_markup: { inline_keyboard: [[{ text: '🚀 Open TRINTOPE Bot', url: `https://t.me/${username}` }]] }
    });
    setTimeout(() => safeDelete(sent.chat.id, sent.message_id), 15000);
    return;
  }
  return sendPrivateHome(msg.chat.id, msg.from.id);
});

bot.on('callback_query', async (q) => {
  const msg = q.message;
  const chatId = msg.chat.id;
  const userId = q.from.id;
  const mId = msg.message_id;
  await bot.answerCallbackQuery(q.id).catch(() => {});

  if (msg.chat.type !== 'private') return;

  const action = q.data;
  if (action === 'close') return safeDelete(chatId, mId);
  if (action === 'home') { const s = renderHome(userId); return sendOrEdit(chatId, mId, s.text, s.opts.reply_markup); }
  if (action === 'market') return sendOrEdit(chatId, mId, '📊 Market\n\nToken data will be available after launch.', marketKeyboard());
  if (action === 'project') return sendOrEdit(chatId, mId, '📚 Project\n\nChoose a section below.', projectKeyboard());
  if (action === 'community') return sendOrEdit(chatId, mId, '🌍 Community\n\nUse only official TRINTOPE links.', communityKeyboard());
  if (action === 'more') return sendOrEdit(chatId, mId, '⚙️ More\n\nMore tools will be added soon.', backKeyboard('home'));

  if (action === 'price') return sendOrEdit(chatId, mId, '💰 Price\n\nToken is not live yet. Price tracking will be available after launch.', backKeyboard('market'));
  if (action === 'chart') return sendOrEdit(chatId, mId, '📈 Chart\n\nChart will be available after launch.', backKeyboard('market'));
  if (action === 'buy') return sendOrEdit(chatId, mId, '🛒 Buy\n\nTrading is not available yet. Stay tuned.', backKeyboard('market'));

  if (action === 'news') return sendOrEdit(chatId, mId, `📢 News\n\n${data.news}`, backKeyboard('project'));
  if (action === 'roadmap') return sendOrEdit(chatId, mId, `🗺 Roadmap\n\n${data.roadmap}`, backKeyboard('project'));
  if (action === 'tokenomics') return sendOrEdit(chatId, mId, `💎 Tokenomics\n\n${data.tokenomics}`, backKeyboard('project'));
  if (action === 'faq') return sendOrEdit(chatId, mId, `❓ FAQ\n\n${data.faq}`, backKeyboard('project'));

  if (action === 'admin') {
    if (!isOwner(userId)) return sendOrEdit(chatId, mId, '❌ Access denied.', backKeyboard('home'));
    return sendOrEdit(chatId, mId, '🔒 Admin Panel\n\nOwner-only control area.', adminKeyboard());
  }
  if (action === 'admin_stats') {
    if (!isOwner(userId)) return;
    const count = Object.keys(data.users || {}).length;
    return sendOrEdit(chatId, mId, `📊 Stats\n\nUsers seen: ${count}\nOwners: ${data.ownerIds.length}`, backKeyboard('admin'));
  }
  if (action === 'admin_status') {
    if (!isOwner(userId)) return;
    return sendOrEdit(chatId, mId, `🟢 Project Status\n\nCurrent: ${data.projectStatus}\n\nChange via commands:\n/set_status Building\n/set_status Presale\n/set_status Live`, backKeyboard('admin'));
  }
  if (action === 'admin_news') {
    if (!isOwner(userId)) return;
    return sendOrEdit(chatId, mId, `📢 News Admin\n\nChange news with:\n/set_news Your news text`, backKeyboard('admin'));
  }
  if (action === 'admin_links') {
    if (!isOwner(userId)) return;
    return sendOrEdit(chatId, mId, `🔗 Links Admin\n\nWebsite: ${data.links.website}\nX: ${data.links.x}\n\nChange with:\n/set_website https://...\n/set_x https://x.com/...`, backKeyboard('admin'));
  }
});

function ownerTextCommand(regex, handler) {
  bot.onText(regex, async (msg, match) => {
    rememberUser(msg);
    if (!isPrivate(msg) || !isOwner(msg.from.id)) return;
    return handler(msg, match);
  });
}

ownerTextCommand(/^\/set_status\s+(.+)/, async (msg, match) => {
  data.projectStatus = match[1].trim();
  saveData();
  bot.sendMessage(msg.chat.id, `✅ Status updated: ${data.projectStatus}`);
});

ownerTextCommand(/^\/set_news\s+([\s\S]+)/, async (msg, match) => {
  data.news = match[1].trim();
  saveData();
  bot.sendMessage(msg.chat.id, '✅ News updated.');
});

ownerTextCommand(/^\/set_website\s+(.+)/, async (msg, match) => {
  data.links.website = match[1].trim();
  saveData();
  bot.sendMessage(msg.chat.id, '✅ Website updated.');
});

ownerTextCommand(/^\/set_x\s+(.+)/, async (msg, match) => {
  data.links.x = match[1].trim();
  saveData();
  bot.sendMessage(msg.chat.id, '✅ X link updated.');
});

bot.on('message', async (msg) => {
  if (!isPrivate(msg) && msg.text && msg.text.startsWith('/')) {
    await safeDelete(msg.chat.id, msg.message_id);
  }
});

console.log('TRINTOPE Bot started');
