const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_SETUP_CODE = process.env.OWNER_SETUP_CODE || '';
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  ownerIds: [],
  project: {
    status: 'Building',
    website: 'https://ea32b09e.trintope-universe.pages.dev/',
    x: 'https://x.com/AndrejK40133234',
    telegram: '',
    welcome: '🚀 Welcome to TRINTOPE\n\nOfficial TRINTOPE assistant.\n\nAccess official links, project information and future token data.',
    news: 'No announcements yet.',
    roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
    tokenomics: 'Coming soon.',
    faq: 'What is TRINTOPE?\n\nA community-driven Web3 project.\n\nWhen launch?\n\nThe launch date will be announced soon.'
  },
  stats: {
    users: {},
    buttonClicks: {},
    adminActions: []
  },
  sessions: {}
};

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return merge(DEFAULT_DATA, parsed);
  } catch (e) {
    console.error('Failed to load data.json:', e.message);
    return structuredClone(DEFAULT_DATA);
  }
}

function merge(base, patch) {
  const result = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(patch || {})) {
    if (patch[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
      result[key] = merge(base[key] || {}, patch[key]);
    } else {
      result[key] = patch[key];
    }
  }
  return result;
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const data = loadData();

function isPrivate(msgOrQuery) {
  const chat = msgOrQuery.chat || msgOrQuery.message?.chat;
  return chat?.type === 'private';
}

function uidOf(msgOrQuery) {
  return String(msgOrQuery.from?.id || '');
}

function isAdmin(userId) {
  const id = String(userId);
  return ADMIN_IDS.includes(id) || data.ownerIds.map(String).includes(id);
}

function trackUser(msgOrQuery) {
  const user = msgOrQuery.from;
  if (!user) return;
  const id = String(user.id);
  data.stats.users[id] = {
    id,
    username: user.username || '',
    first_name: user.first_name || '',
    last_seen: new Date().toISOString()
  };
  saveData();
}

function logAdmin(userId, action) {
  data.stats.adminActions.unshift({ userId: String(userId), action, at: new Date().toISOString() });
  data.stats.adminActions = data.stats.adminActions.slice(0, 50);
  saveData();
}

function incClick(action) {
  data.stats.buttonClicks[action] = (data.stats.buttonClicks[action] || 0) + 1;
  saveData();
}

function kb(rows) {
  return { reply_markup: { inline_keyboard: rows } };
}

function mainKeyboard(userId) {
  const rows = [
    [{ text: '📊 Market', callback_data: 'market' }, { text: '🌍 Community', callback_data: 'community' }],
    [{ text: '📚 Project', callback_data: 'project' }, { text: '⚙️ More', callback_data: 'more' }],
    [{ text: '❌ Close', callback_data: 'close' }]
  ];
  if (isAdmin(userId)) rows.splice(2, 0, [{ text: '🔒 Admin Panel', callback_data: 'admin' }]);
  return kb(rows);
}

function header() {
  return `🚀 TRINTOPE\n\n🟢 Status: ${data.project.status}\n\n${data.project.welcome}`;
}

async function sendOrEdit(chatId, messageId, text, keyboard) {
  try {
    if (messageId) {
      await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'HTML', ...keyboard });
      return messageId;
    }
  } catch (_) {}
  const sent = await bot.sendMessage(chatId, text, { parse_mode: 'HTML', ...keyboard });
  return sent.message_id;
}

async function cleanGroupCommand(msg) {
  try { await bot.deleteMessage(msg.chat.id, msg.message_id); } catch (_) {}
  const username = (await bot.getMe()).username;
  const sent = await bot.sendMessage(
    msg.chat.id,
    '🔒 Open the official TRINTOPE bot in private chat.',
    kb([[{ text: '🚀 Open TRINTOPE Bot', url: `https://t.me/${username}` }]])
  );
  setTimeout(() => bot.deleteMessage(msg.chat.id, sent.message_id).catch(() => {}), 12000);
}

bot.onText(/^\/id$/, async (msg) => {
  trackUser(msg);
  if (!isPrivate(msg)) return cleanGroupCommand(msg);
  await bot.sendMessage(msg.chat.id, `Your Telegram ID:\n<code>${msg.from.id}</code>`, { parse_mode: 'HTML' });
});

bot.onText(/^\/setup_owner(?:\s+(.+))?$/, async (msg, match) => {
  trackUser(msg);
  if (!isPrivate(msg)) return cleanGroupCommand(msg);
  const code = (match?.[1] || '').trim();
  if (!OWNER_SETUP_CODE) return bot.sendMessage(msg.chat.id, 'Owner setup is disabled. Add OWNER_SETUP_CODE in Railway first.');
  if (code !== OWNER_SETUP_CODE) return bot.sendMessage(msg.chat.id, '❌ Wrong setup code.');
  const id = String(msg.from.id);
  if (!data.ownerIds.includes(id)) data.ownerIds.push(id);
  saveData();
  logAdmin(id, 'Owner setup completed');
  await bot.sendMessage(msg.chat.id, '✅ Owner access enabled. Send /start to open Admin Panel.');
});

bot.onText(/^\/start|^\/help/, async (msg) => {
  trackUser(msg);
  if (!isPrivate(msg)) return cleanGroupCommand(msg);
  await bot.sendMessage(msg.chat.id, header(), { parse_mode: 'HTML', ...mainKeyboard(msg.from.id) });
});

bot.on('message', async (msg) => {
  if (!msg.text || !msg.text.startsWith('/')) return;
  if (!isPrivate(msg)) return cleanGroupCommand(msg);
});

bot.on('callback_query', async (q) => {
  trackUser(q);
  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;
  const userId = q.from.id;
  const action = q.data;
  incClick(action);

  if (q.message.chat.type !== 'private') {
    await bot.answerCallbackQuery(q.id, { text: 'Open the bot in private chat.' });
    return;
  }

  if (action === 'close') {
    await bot.answerCallbackQuery(q.id);
    return bot.deleteMessage(chatId, messageId).catch(() => {});
  }

  if (action === 'home') return showHome(chatId, messageId, userId, q.id);
  if (action === 'market') return edit(q, '📊 <b>Market</b>\n\nToken is not live yet. Market data will be available after launch.', [[{ text: '💰 Price', callback_data: 'price' }, { text: '📈 Chart', callback_data: 'chart' }], [{ text: '🛒 Buy', callback_data: 'buy' }], backRow()]);
  if (action === 'price') return edit(q, '💰 <b>Price</b>\n\nToken is not live yet. Price tracking will become available after launch.', [[{ text: '⬅️ Back', callback_data: 'market' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'chart') return edit(q, '📈 <b>Chart</b>\n\nChart will be available after launch.', [[{ text: '⬅️ Back', callback_data: 'market' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'buy') return edit(q, '🛒 <b>Buy</b>\n\nTrading is not available yet. Always use official links only.', [[{ text: '⬅️ Back', callback_data: 'market' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'community') return edit(q, '🌍 <b>Community</b>\n\nChoose an official resource.', [[{ text: '🌐 Website', url: data.project.website }], [{ text: '🐦 X', url: data.project.x }], [{ text: '⬅️ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'project') return edit(q, '📚 <b>Project</b>\n\nSelect a section.', [[{ text: '📢 News', callback_data: 'news' }, { text: '🗺 Roadmap', callback_data: 'roadmap' }], [{ text: '💎 Tokenomics', callback_data: 'tokenomics' }, { text: '❓ FAQ', callback_data: 'faq' }], backRow()]);
  if (action === 'news') return edit(q, `📢 <b>News</b>\n\n${escapeHtml(data.project.news)}`, [[{ text: '⬅️ Back', callback_data: 'project' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'roadmap') return edit(q, `🗺 <b>Roadmap</b>\n\n${escapeHtml(data.project.roadmap)}`, [[{ text: '⬅️ Back', callback_data: 'project' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'tokenomics') return edit(q, `💎 <b>Tokenomics</b>\n\n${escapeHtml(data.project.tokenomics)}`, [[{ text: '⬅️ Back', callback_data: 'project' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'faq') return edit(q, `❓ <b>FAQ</b>\n\n${escapeHtml(data.project.faq)}`, [[{ text: '⬅️ Back', callback_data: 'project' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'more') return edit(q, '⚙️ <b>More</b>\n\nOfficial links and support.', [[{ text: '✅ Official Links', callback_data: 'official_links' }], [{ text: '📞 Support', callback_data: 'support' }], backRow()]);
  if (action === 'official_links') return edit(q, `✅ <b>Official Links</b>\n\nWebsite: ${escapeHtml(data.project.website)}\nX: ${escapeHtml(data.project.x)}\n\nAlways use only official links.`, [[{ text: '⬅️ Back', callback_data: 'more' }, { text: '❌ Close', callback_data: 'close' }]]);
  if (action === 'support') return edit(q, '📞 <b>Support</b>\n\nContact us through the official X account.', [[{ text: '⬅️ Back', callback_data: 'more' }, { text: '❌ Close', callback_data: 'close' }]]);

  if (action.startsWith('admin')) return handleAdmin(q);
  if (action.startsWith('set_status:')) return setStatus(q, action.split(':')[1]);

  await bot.answerCallbackQuery(q.id);
});

function backRow() { return [{ text: '⬅️ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]; }

async function showHome(chatId, messageId, userId, cbId) {
  if (cbId) await bot.answerCallbackQuery(cbId).catch(() => {});
  return sendOrEdit(chatId, messageId, header(), mainKeyboard(userId));
}

async function edit(q, text, rows) {
  await bot.answerCallbackQuery(q.id).catch(() => {});
  return sendOrEdit(q.message.chat.id, q.message.message_id, text, kb(rows));
}

async function handleAdmin(q) {
  const userId = q.from.id;
  if (!isAdmin(userId)) {
    await bot.answerCallbackQuery(q.id, { text: 'Access denied.', show_alert: true });
    return;
  }
  if (q.data === 'admin') {
    return edit(q, '🔒 <b>Admin Panel</b>\n\nOnly the project owner can see this section.', [
      [{ text: '📊 Stats', callback_data: 'admin_stats' }, { text: '🟢 Status', callback_data: 'admin_status' }],
      [{ text: '📋 Logs', callback_data: 'admin_logs' }, { text: '🔗 Links', callback_data: 'admin_links' }],
      [{ text: '⬅️ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
    ]);
  }
  if (q.data === 'admin_stats') {
    const users = Object.keys(data.stats.users).length;
    const clicks = Object.entries(data.stats.buttonClicks).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v]) => `${k}: ${v}`).join('\n') || 'No clicks yet.';
    return edit(q, `📊 <b>Stats</b>\n\nUsers: ${users}\n\nTop actions:\n${escapeHtml(clicks)}`, [[{ text: '⬅️ Back', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]]);
  }
  if (q.data === 'admin_status') {
    return edit(q, `🟢 <b>Project Status</b>\n\nCurrent: ${escapeHtml(data.project.status)}`, [
      [{ text: 'Building', callback_data: 'set_status:Building' }, { text: 'Presale', callback_data: 'set_status:Presale' }, { text: 'Live', callback_data: 'set_status:Live' }],
      [{ text: '⬅️ Back', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]
    ]);
  }
  if (q.data === 'admin_logs') {
    const logs = data.stats.adminActions.slice(0,10).map(l => `${l.at} — ${l.action}`).join('\n') || 'No admin actions yet.';
    return edit(q, `📋 <b>Admin Logs</b>\n\n${escapeHtml(logs)}`, [[{ text: '⬅️ Back', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]]);
  }
  if (q.data === 'admin_links') {
    return edit(q, `🔗 <b>Links</b>\n\nWebsite: ${escapeHtml(data.project.website)}\nX: ${escapeHtml(data.project.x)}\n\nEditing links from Telegram will be added next.`, [[{ text: '⬅️ Back', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]]);
  }
}

async function setStatus(q, status) {
  const userId = q.from.id;
  if (!isAdmin(userId)) return bot.answerCallbackQuery(q.id, { text: 'Access denied.', show_alert: true });
  data.project.status = status;
  saveData();
  logAdmin(userId, `Changed status to ${status}`);
  return edit(q, `✅ <b>Status updated</b>\n\nNew status: ${escapeHtml(status)}`, [[{ text: '⬅️ Back', callback_data: 'admin_status' }, { text: '🏠 Home', callback_data: 'home' }]]);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

bot.on('polling_error', (err) => console.error('Polling error:', err.message));
console.log('TRINTOPE bot is running');
