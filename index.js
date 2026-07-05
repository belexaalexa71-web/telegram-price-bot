const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_SETUP_CODE = process.env.OWNER_SETUP_CODE || '';
const ADMIN_IDS_ENV = process.env.ADMIN_IDS || '';
const AUTO_DELETE_MS = Number(process.env.AUTO_DELETE_MS || 10 * 60 * 1000);

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const DATA_FILE = path.join(__dirname, 'data.json');
let botUsername = '';

const defaultData = {
  ownerIds: [],
  admins: [],
  users: {},
  settings: {
    projectName: 'TRINTOPE',
    status: 'Building',
    website: 'https://ea32b09e.trintope-universe.pages.dev/',
    x: 'https://x.com/AndrejK40133234',
    telegram: '',
    news: 'No announcements yet. Follow official links for updates.',
    roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
    tokenomics: 'Coming soon. Tokenomics will be published before launch.',
    faq: 'Q: What is TRINTOPE?\nA: A community-driven Web3 project.\n\nQ: When launch?\nA: Launch date will be announced soon.',
    welcome: 'Official Project Assistant'
  },
  logs: []
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return merge(defaultData, saved);
    }
  } catch (e) {
    console.error('Cannot read data.json:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function merge(base, saved) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(saved || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k]) out[k] = merge(base[k], v);
    else out[k] = v;
  }
  return out;
}

let data = loadData();
for (const id of ADMIN_IDS_ENV.split(',').map(x => x.trim()).filter(Boolean)) {
  const n = Number(id);
  if (Number.isFinite(n) && !data.ownerIds.includes(n)) data.ownerIds.push(n);
}
saveData();

function saveData() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
  catch (e) { console.error('Cannot write data.json:', e.message); }
}

function logAction(userId, action) {
  data.logs.unshift({ time: new Date().toISOString(), userId, action });
  data.logs = data.logs.slice(0, 50);
  saveData();
}

function isPrivate(msgOrQuery) {
  const chat = msgOrQuery.message ? msgOrQuery.message.chat : msgOrQuery.chat;
  return chat && chat.type === 'private';
}

function isAdminId(id) {
  return data.ownerIds.includes(Number(id)) || data.admins.includes(Number(id));
}

function trackUser(user) {
  if (!user || !user.id) return;
  data.users[user.id] = {
    id: user.id,
    username: user.username || '',
    first_name: user.first_name || '',
    last_seen: new Date().toISOString()
  };
  saveData();
}

async function safeDelete(chatId, messageId) {
  try { await bot.deleteMessage(chatId, messageId); } catch (_) {}
}

const session = new Map();
const timers = new Map();
const editState = new Map();

function statusIcon() {
  const s = data.settings.status.toLowerCase();
  if (s.includes('live')) return '🟢';
  if (s.includes('presale')) return '🟡';
  return '🔵';
}

function inline(rows) { return { reply_markup: { inline_keyboard: rows } }; }
function urlButton(text, url) { return url ? { text, url } : { text, callback_data: 'missing_link' }; }

function homeText(userId) {
  const adminLine = isAdminId(userId) ? '\n\n🔒 Owner mode enabled.' : '';
  return `🚀 ${data.settings.projectName}\n\n${data.settings.welcome}\n\n${statusIcon()} Status: ${data.settings.status}\n\nChoose an option below.${adminLine}`;
}

function homeKb(userId) {
  const rows = [
    [{ text: '📊 Market', callback_data: 'market' }, { text: '🌍 Community', callback_data: 'community' }],
    [{ text: '📚 Project', callback_data: 'project' }, { text: '❓ FAQ', callback_data: 'faq' }]
  ];
  if (isAdminId(userId)) rows.push([{ text: '🔒 Admin Panel', callback_data: 'admin' }]);
  rows.push([{ text: '❌ Close', callback_data: 'close' }]);
  return inline(rows);
}

function backKb(parent = 'home') { return inline([[{ text: '⬅ Back', callback_data: parent }, { text: '❌ Close', callback_data: 'close' }]]); }

async function showOrEdit(chatId, userId, text, keyboard, messageId = null) {
  clearMenuTimer(chatId);
  try {
    if (messageId) {
      await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'HTML', ...keyboard });
      session.set(chatId, messageId);
      setMenuTimer(chatId, messageId);
      return messageId;
    }
  } catch (_) {}

  const old = session.get(chatId);
  if (old) await safeDelete(chatId, old);
  const sent = await bot.sendMessage(chatId, text, { parse_mode: 'HTML', ...keyboard });
  session.set(chatId, sent.message_id);
  setMenuTimer(chatId, sent.message_id);
  return sent.message_id;
}

function setMenuTimer(chatId, messageId) {
  clearMenuTimer(chatId);
  const t = setTimeout(async () => {
    await safeDelete(chatId, messageId);
    session.delete(chatId);
    timers.delete(chatId);
  }, AUTO_DELETE_MS);
  timers.set(chatId, t);
}
function clearMenuTimer(chatId) { if (timers.has(chatId)) clearTimeout(timers.get(chatId)); timers.delete(chatId); }

async function groupRedirect(msg) {
  const chatId = msg.chat.id;
  await safeDelete(chatId, msg.message_id);
  const url = botUsername ? `https://t.me/${botUsername}?start=group` : undefined;
  const sent = await bot.sendMessage(chatId, '🔒 Open the official TRINTOPE Bot in private chat to use the menu.', inline([[urlButton('🤖 Open Bot', url)]]));
  setTimeout(() => safeDelete(chatId, sent.message_id), 12000);
}

bot.getMe().then(me => { botUsername = me.username; console.log(`Bot running as @${botUsername}`); });

bot.onText(/^\/id/, async (msg) => {
  trackUser(msg.from);
  await safeDelete(msg.chat.id, msg.message_id);
  if (msg.chat.type !== 'private') return groupRedirect(msg);
  const sent = await bot.sendMessage(msg.chat.id, `Your Telegram ID:\n<code>${msg.from.id}</code>`, { parse_mode: 'HTML' });
  setTimeout(() => safeDelete(msg.chat.id, sent.message_id), 20000);
});

bot.onText(/^\/setup_owner(?:\s+(.+))?/, async (msg, match) => {
  trackUser(msg.from);
  await safeDelete(msg.chat.id, msg.message_id);
  if (msg.chat.type !== 'private') return;
  if (data.ownerIds.length > 0 && !data.ownerIds.includes(msg.from.id)) {
    const sent = await bot.sendMessage(msg.chat.id, '🔒 Owner is already configured.');
    return setTimeout(() => safeDelete(msg.chat.id, sent.message_id), 8000);
  }
  const code = (match[1] || '').trim();
  if (!OWNER_SETUP_CODE || code !== OWNER_SETUP_CODE) {
    const sent = await bot.sendMessage(msg.chat.id, '❌ Invalid setup code.');
    return setTimeout(() => safeDelete(msg.chat.id, sent.message_id), 8000);
  }
  if (!data.ownerIds.includes(msg.from.id)) data.ownerIds.push(msg.from.id);
  saveData();
  logAction(msg.from.id, 'Owner access activated');
  const sent = await bot.sendMessage(msg.chat.id, '✅ Owner access activated. Admin Panel is now available to you.');
  setTimeout(() => safeDelete(msg.chat.id, sent.message_id), 12000);
  await showOrEdit(msg.chat.id, msg.from.id, homeText(msg.from.id), homeKb(msg.from.id));
});

bot.onText(/^\/start/, async (msg) => {
  trackUser(msg.from);
  await safeDelete(msg.chat.id, msg.message_id);
  if (msg.chat.type !== 'private') return groupRedirect(msg);
  await showOrEdit(msg.chat.id, msg.from.id, homeText(msg.from.id), homeKb(msg.from.id));
});

bot.onText(/^\/help/, async (msg) => {
  trackUser(msg.from);
  await safeDelete(msg.chat.id, msg.message_id);
  if (msg.chat.type !== 'private') return groupRedirect(msg);
  await showOrEdit(msg.chat.id, msg.from.id, '❓ Help\n\nUse the buttons to navigate. The chat stays clean: commands and menus can disappear automatically.', backKb('home'));
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  trackUser(msg.from);
  const st = editState.get(msg.from.id);
  if (!st || msg.chat.type !== 'private' || !isAdminId(msg.from.id)) return;
  await safeDelete(msg.chat.id, msg.message_id);
  data.settings[st.field] = msg.text.trim();
  saveData();
  logAction(msg.from.id, `Updated ${st.field}`);
  editState.delete(msg.from.id);
  await showOrEdit(msg.chat.id, msg.from.id, `✅ Updated: ${st.label}\n\n${escapeHtml(msg.text.trim())}`, adminKb(), session.get(msg.chat.id));
});

bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const userId = q.from.id;
  const mid = q.message.message_id;
  trackUser(q.from);
  await bot.answerCallbackQuery(q.id).catch(() => {});

  if (q.message.chat.type !== 'private') return;

  const c = q.data;
  if (c === 'close') {
    clearMenuTimer(chatId);
    await safeDelete(chatId, mid);
    session.delete(chatId);
    return;
  }
  if (c === 'home') return showOrEdit(chatId, userId, homeText(userId), homeKb(userId), mid);
  if (c === 'market') return showOrEdit(chatId, userId, '📊 Market\n\n💰 Price: Token is not live yet.\n📈 Chart: Available after launch.\n🛒 Buy: Trading is not available yet.', backKb('home'), mid);
  if (c === 'community') return showOrEdit(chatId, userId, '🌍 Community\n\nUse only official links below.', inline([[urlButton('🌐 Website', data.settings.website), urlButton('🐦 X', data.settings.x)], [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]]), mid);
  if (c === 'project') return showOrEdit(chatId, userId, `📚 Project\n\n📢 News:\n${escapeHtml(data.settings.news)}\n\n🗺 Roadmap:\n${escapeHtml(data.settings.roadmap)}\n\n💎 Tokenomics:\n${escapeHtml(data.settings.tokenomics)}`, backKb('home'), mid);
  if (c === 'faq') return showOrEdit(chatId, userId, `❓ FAQ\n\n${escapeHtml(data.settings.faq)}`, backKb('home'), mid);
  if (c === 'missing_link') return showOrEdit(chatId, userId, '⚠️ This link is not configured yet.', backKb('home'), mid);

  if (c === 'admin') {
    if (!isAdminId(userId)) return showOrEdit(chatId, userId, '🔒 Access denied.', backKb('home'), mid);
    return showOrEdit(chatId, userId, adminText(), adminKb(), mid);
  }
  if (c === 'admin_status') return showOrEdit(chatId, userId, '🟢 Choose project status:', inline([[{ text: '🔵 Building', callback_data: 'set_status:Building' }, { text: '🟡 Presale', callback_data: 'set_status:Presale' }], [{ text: '🟢 Live', callback_data: 'set_status:Live' }], [{ text: '⬅ Back', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]]), mid);
  if (c.startsWith('set_status:')) {
    if (!isAdminId(userId)) return;
    data.settings.status = c.split(':')[1]; saveData(); logAction(userId, `Status changed to ${data.settings.status}`);
    return showOrEdit(chatId, userId, `✅ Status changed to: ${data.settings.status}`, adminKb(), mid);
  }
  const editMap = {
    admin_links_website: ['website', 'Website URL'],
    admin_links_x: ['x', 'X URL'],
    admin_news: ['news', 'News'],
    admin_roadmap: ['roadmap', 'Roadmap'],
    admin_tokenomics: ['tokenomics', 'Tokenomics'],
    admin_faq: ['faq', 'FAQ'],
    admin_welcome: ['welcome', 'Welcome Text']
  };
  if (c === 'admin_links') return showOrEdit(chatId, userId, '🔗 Edit Links', inline([[{ text: '🌐 Website', callback_data: 'admin_links_website' }, { text: '🐦 X', callback_data: 'admin_links_x' }], [{ text: '⬅ Back', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]]), mid);
  if (editMap[c]) {
    const [field, label] = editMap[c];
    editState.set(userId, { field, label });
    return showOrEdit(chatId, userId, `✏️ Send new ${label} in the next message.\n\nCurrent value:\n${escapeHtml(data.settings[field])}`, backKb('admin'), mid);
  }
  if (c === 'admin_stats') {
    const users = Object.keys(data.users).length;
    const logs = data.logs.slice(0, 6).map(l => `• ${new Date(l.time).toLocaleString()} — ${escapeHtml(l.action)}`).join('\n') || 'No logs yet.';
    return showOrEdit(chatId, userId, `📊 Stats\n\nUsers: ${users}\nStatus: ${data.settings.status}\n\nRecent actions:\n${logs}`, adminKb(), mid);
  }
});

function adminText() {
  return `🔒 TRINTOPE Control Center\n\nWelcome back, Owner.\n\nStatus: ${statusIcon()} ${data.settings.status}\nVersion: 2.0.0\n\nManage your ecosystem from Telegram.`;
}
function adminKb() {
  return inline([
    [{ text: '🟢 Status', callback_data: 'admin_status' }, { text: '🔗 Links', callback_data: 'admin_links' }],
    [{ text: '📢 News', callback_data: 'admin_news' }, { text: '🗺 Roadmap', callback_data: 'admin_roadmap' }],
    [{ text: '💎 Tokenomics', callback_data: 'admin_tokenomics' }, { text: '❓ FAQ', callback_data: 'admin_faq' }],
    [{ text: '✏️ Welcome', callback_data: 'admin_welcome' }, { text: '📊 Stats', callback_data: 'admin_stats' }],
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]);
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
}

process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));
