import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_SETUP_CODE = process.env.OWNER_SETUP_CODE || '';
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
const DATABASE_URL = process.env.DATABASE_URL || '';
const MENU_TTL_MS = Number(process.env.MENU_TTL_MS || 300000);
const APP_VERSION = '0.3.0';

if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN');
  process.exit(1);
}

const DEFAULTS = {
  version: APP_VERSION,
  status: 'Development',
  website: process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/',
  x: process.env.X_URL || 'https://x.com/AndrejK40133234',
  telegram_group: '',
  telegram_channel: '',
  whitepaper: 'Coming soon.',
  network: 'Solana',
  launch_status: 'Preparing',
  launch_date: 'TBA',
  contract: 'Coming soon.',
  buy: 'Available after launch.',
  chart: 'Available after launch.',
  solscan: 'Available after launch.',
  dex: 'Available after launch.',
  news: 'No announcements yet.',
  roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
  tokenomics: 'Network: Solana\nLaunch: Coming soon\nSupply: TBA',
  faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhich network?\nSolana.\n\nWhen launch?\nThe launch date will be announced soon.',
  welcome: 'Official Project Assistant'
};

const jsonPath = path.resolve(process.cwd(), 'data.json');
let pool = null;
let storageMode = 'json';

function readJson() {
  if (!fs.existsSync(jsonPath)) {
    fs.writeFileSync(jsonPath, JSON.stringify({ settings: { ...DEFAULTS }, owners: ADMIN_IDS, users: {}, logs: [] }, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  data.settings ||= { ...DEFAULTS };
  for (const [k, v] of Object.entries(DEFAULTS)) if (data.settings[k] === undefined) data.settings[k] = v;
  data.owners ||= ADMIN_IDS;
  data.users ||= {};
  data.logs ||= [];
  return data;
}

function writeJson(data) {
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
}

async function initStorage() {
  if (DATABASE_URL) {
    try {
      const { Pool } = await import('pg');
      pool = new Pool({ connectionString: DATABASE_URL, ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : undefined });
      await pool.query('SELECT 1');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bot_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS bot_owners (user_id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW());
        CREATE TABLE IF NOT EXISTS bot_users (user_id TEXT PRIMARY KEY, username TEXT, first_name TEXT, last_seen TIMESTAMPTZ DEFAULT NOW());
        CREATE TABLE IF NOT EXISTS bot_logs (id SERIAL PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
      `);
      for (const [k, v] of Object.entries(DEFAULTS)) {
        await pool.query('INSERT INTO bot_settings(key, value) VALUES($1, $2) ON CONFLICT (key) DO NOTHING', [k, String(v)]);
      }
      for (const id of ADMIN_IDS) {
        await pool.query('INSERT INTO bot_owners(user_id) VALUES($1) ON CONFLICT DO NOTHING', [id]);
      }
      storageMode = 'postgres';
      console.log('✅ Connected to PostgreSQL');
      console.log('✅ Database initialized');
      return;
    } catch (err) {
      console.error('⚠️ PostgreSQL unavailable, falling back to data.json:', err.message);
      pool = null;
    }
  }
  const data = readJson();
  for (const id of ADMIN_IDS) if (!data.owners.includes(id)) data.owners.push(id);
  writeJson(data);
  storageMode = 'json';
  console.log('✅ data.json storage initialized');
}

async function getSetting(key) {
  if (pool) {
    const res = await pool.query('SELECT value FROM bot_settings WHERE key=$1', [key]);
    return res.rows[0]?.value ?? DEFAULTS[key] ?? '';
  }
  return readJson().settings[key] ?? DEFAULTS[key] ?? '';
}

async function setSetting(key, value, actorId = 'system') {
  if (!Object.hasOwn(DEFAULTS, key)) throw new Error(`Unknown setting: ${key}`);
  if (pool) {
    await pool.query('INSERT INTO bot_settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2', [key, String(value)]);
  } else {
    const data = readJson();
    data.settings[key] = String(value);
    writeJson(data);
  }
  await logAction(actorId, `Updated ${key}`);
}

async function allSettings() {
  if (pool) {
    const res = await pool.query('SELECT key, value FROM bot_settings');
    const out = { ...DEFAULTS };
    for (const row of res.rows) out[row.key] = row.value;
    return out;
  }
  return { ...DEFAULTS, ...readJson().settings };
}

async function ownerIds() {
  if (pool) {
    const res = await pool.query('SELECT user_id FROM bot_owners');
    return new Set(res.rows.map(r => String(r.user_id)));
  }
  return new Set(readJson().owners.map(String));
}

async function isOwnerId(id) {
  return (await ownerIds()).has(String(id));
}

async function addOwner(id, actorId = 'system') {
  if (pool) {
    await pool.query('INSERT INTO bot_owners(user_id) VALUES($1) ON CONFLICT DO NOTHING', [String(id)]);
  } else {
    const data = readJson();
    if (!data.owners.includes(String(id))) data.owners.push(String(id));
    writeJson(data);
  }
  await logAction(actorId, `Owner added: ${id}`);
}

async function trackUser(user) {
  if (!user?.id) return;
  const id = String(user.id);
  if (pool) {
    await pool.query(
      'INSERT INTO bot_users(user_id,username,first_name,last_seen) VALUES($1,$2,$3,NOW()) ON CONFLICT(user_id) DO UPDATE SET username=$2, first_name=$3, last_seen=NOW()',
      [id, user.username || '', user.first_name || '']
    );
  } else {
    const data = readJson();
    data.users[id] = { id, username: user.username || '', firstName: user.first_name || '', lastSeen: new Date().toISOString() };
    writeJson(data);
  }
}

async function logAction(actorId, action) {
  if (pool) {
    await pool.query('INSERT INTO bot_logs(actor_id, action) VALUES($1, $2)', [String(actorId), action]);
  } else {
    const data = readJson();
    data.logs.unshift({ at: new Date().toISOString(), actorId: String(actorId), action });
    data.logs = data.logs.slice(0, 100);
    writeJson(data);
  }
}

async function getStats() {
  if (pool) {
    const users = await pool.query('SELECT COUNT(*)::int AS count FROM bot_users');
    const owners = await pool.query('SELECT COUNT(*)::int AS count FROM bot_owners');
    const logs = await pool.query('SELECT action, created_at FROM bot_logs ORDER BY id DESC LIMIT 8');
    return { users: users.rows[0].count, owners: owners.rows[0].count, logs: logs.rows };
  }
  const data = readJson();
  return { users: Object.keys(data.users).length, owners: data.owners.length, logs: data.logs.slice(0, 8) };
}

const bot = new Telegraf(BOT_TOKEN);
const menuMessages = new Map();
const cleanupTimers = new Map();
const pendingEdit = new Map();

const isPrivate = (ctx) => ctx.chat?.type === 'private';
const userId = (ctx) => String(ctx.from?.id || '');

const FIELD_LABELS = {
  welcome: 'Welcome message',
  news: 'News',
  faq: 'FAQ',
  whitepaper: 'Whitepaper',
  roadmap: 'Roadmap',
  tokenomics: 'Tokenomics',
  network: 'Network',
  launch_status: 'Launch status',
  launch_date: 'Launch date',
  contract: 'Contract',
  chart: 'Chart link',
  buy: 'Buy link',
  solscan: 'Solscan link',
  dex: 'DEX link',
  website: 'Website',
  x: 'X account',
  telegram_group: 'Telegram Group',
  telegram_channel: 'Telegram Channel',
  status: 'Project status'
};

function statusIcon(status) {
  const icons = { Development: '🟢', Testing: '🧪', Presale: '🟡', Live: '🚀', Building: '🛠' };
  return icons[status] || '🟢';
}
function displayField(key) { return FIELD_LABELS[key] || key; }
function fmtLog(log) {
  const at = log.created_at ? new Date(log.created_at).toLocaleString() : (log.at ? new Date(log.at).toLocaleString() : '');
  return `• ${at ? at + ' — ' : ''}${log.action}`;
}

async function safeDelete(ctx, chatId, messageId) {
  try { await ctx.telegram.deleteMessage(chatId, messageId); } catch (_) {}
}
async function deleteIncoming(ctx) {
  if (ctx.message?.message_id) await safeDelete(ctx, ctx.chat.id, ctx.message.message_id);
}
function resetTimer(ctx, chatId, messageId) {
  const key = `${chatId}:${messageId}`;
  if (cleanupTimers.has(key)) clearTimeout(cleanupTimers.get(key));
  cleanupTimers.set(key, setTimeout(async () => {
    await safeDelete(ctx, chatId, messageId);
    cleanupTimers.delete(key);
    menuMessages.delete(String(chatId));
  }, MENU_TTL_MS));
}
async function showMenu(ctx, text, keyboard) {
  const chatId = ctx.chat.id;
  const currentId = menuMessages.get(String(chatId));
  if (currentId) {
    try {
      await ctx.telegram.editMessageText(chatId, currentId, undefined, text, { reply_markup: keyboard.reply_markup, disable_web_page_preview: true });
      resetTimer(ctx, chatId, currentId);
      return;
    } catch (_) {}
  }
  const sent = await ctx.reply(text, { reply_markup: keyboard.reply_markup, disable_web_page_preview: true });
  menuMessages.set(String(chatId), sent.message_id);
  resetTimer(ctx, chatId, sent.message_id);
}
function btn(text, data) { return Markup.button.callback(text, data); }
function url(text, link) { return Markup.button.url(text, link); }
function isUrl(value) { return /^https?:\/\//i.test(String(value || '').trim()); }
function urlRow(label, value) { return isUrl(value) ? [url(label, value)] : []; }
function nav(back = 'home') {
  return Markup.inlineKeyboard([[btn('⬅️ Back', back), btn('🏠 Home', 'home')], [btn('❌ Close', 'close')]]);
}
async function homeKeyboard(ctx) {
  const rows = [[btn('🚀 Launch', 'launch'), btn('📊 Market', 'market')], [btn('🌍 Community', 'community'), btn('📚 Project', 'project')], [btn('❓ Help', 'help')]];
  if (await isOwnerId(userId(ctx)) && isPrivate(ctx)) rows.push([btn('🔒 Control Center', 'admin')]);
  rows.push([btn('❌ Close', 'close')]);
  return Markup.inlineKeyboard(rows);
}
async function homeText() {
  const s = await allSettings();
  return `🔷 TRINTOPE\n\n${s.welcome}\n\n${statusIcon(s.status)} Status: ${s.status}\nVersion: ${APP_VERSION}\n\nChoose an option below.`;
}
function adminKeyboard() {
  return Markup.inlineKeyboard([
    [btn('🚀 Launch Center', 'admin_launch')],
    [btn('📢 Content Manager', 'admin_content')],
    [btn('🌐 Project Settings', 'admin_project')],
    [btn('📊 Analytics', 'admin_stats'), btn('⚙️ System', 'admin_system')],
    [btn('🏠 Home', 'home'), btn('❌ Close', 'close')]
  ]);
}
async function groupCommand(ctx) {
  await deleteIncoming(ctx);
  const me = await ctx.telegram.getMe();
  const sent = await ctx.reply('🔒 Open the official TRINTOPE Bot in private chat.', Markup.inlineKeyboard([[Markup.button.url('Open TRINTOPE Bot', `https://t.me/${me.username}`)]]));
  setTimeout(() => safeDelete(ctx, ctx.chat.id, sent.message_id), 12000);
}
async function requireOwner(ctx) {
  if (await isOwnerId(userId(ctx))) return true;
  await ctx.answerCbQuery('Access denied', { show_alert: true }).catch(() => {});
  return false;
}

bot.start(async (ctx) => {
  await trackUser(ctx.from);
  if (!isPrivate(ctx)) return groupCommand(ctx);
  await deleteIncoming(ctx);
  await showMenu(ctx, await homeText(), await homeKeyboard(ctx));
});

bot.command('help', async (ctx) => {
  if (!isPrivate(ctx)) return groupCommand(ctx);
  await deleteIncoming(ctx);
  await showMenu(ctx, '❓ Help\n\nUse the buttons to navigate. All project management happens inside Control Center.', nav('home'));
});

bot.command('id', async (ctx) => {
  if (!isPrivate(ctx)) return groupCommand(ctx);
  await deleteIncoming(ctx);
  const sent = await ctx.reply(`Your Telegram ID:\n${ctx.from.id}`);
  setTimeout(() => safeDelete(ctx, ctx.chat.id, sent.message_id), 15000);
});

bot.command('setup_owner', async (ctx) => {
  if (!isPrivate(ctx)) return groupCommand(ctx);
  await deleteIncoming(ctx);
  const code = (ctx.message?.text || '').split(' ').slice(1).join(' ').trim();
  if (!OWNER_SETUP_CODE) return showMenu(ctx, '❌ OWNER_SETUP_CODE is not configured.', nav('home'));
  const owners = await ownerIds();
  if (owners.size > 0 && !(await isOwnerId(userId(ctx)))) return showMenu(ctx, '🔒 Owner is already configured.', nav('home'));
  if (code !== OWNER_SETUP_CODE) return showMenu(ctx, '❌ Invalid setup code.', nav('home'));
  await addOwner(userId(ctx), userId(ctx));
  await showMenu(ctx, '✅ Owner access activated. Control Center is now available.', await homeKeyboard(ctx));
});

bot.on('text', async (ctx) => {
  await trackUser(ctx.from);
  if (!isPrivate(ctx)) {
    if ((ctx.message.text || '').startsWith('/')) return groupCommand(ctx);
    return;
  }
  const editKey = pendingEdit.get(userId(ctx));
  if (!editKey) return;
  await deleteIncoming(ctx);
  if (!(await isOwnerId(userId(ctx)))) return;
  const value = ctx.message.text.trim();
  await setSetting(editKey, value, userId(ctx));
  pendingEdit.delete(userId(ctx));
  await showMenu(ctx, `✅ Saved: ${displayField(editKey)}\n\n${value}`, Markup.inlineKeyboard([
    [btn('⬅️ Control Center', 'admin')],
    [btn('❌ Close', 'close')]
  ]));
});

bot.on('callback_query', async (ctx) => {
  await trackUser(ctx.from);
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery().catch(() => {});
  if (!isPrivate(ctx)) return;
  if (data === 'close') {
    const msgId = ctx.callbackQuery.message?.message_id;
    if (msgId) await safeDelete(ctx, ctx.chat.id, msgId);
    menuMessages.delete(String(ctx.chat.id));
    return;
  }
  if (data === 'home') return showMenu(ctx, await homeText(), await homeKeyboard(ctx));

  const s = await allSettings();
  if (data === 'launch') {
    const rows = [
      ...urlRow('📈 Chart', s.chart),
      ...urlRow('🛒 Buy', s.buy),
      ...urlRow('🔎 Solscan', s.solscan),
      [btn('⬅️ Back', 'home'), btn('❌ Close', 'close')]
    ];
    return showMenu(ctx, `🚀 TRINTOPE Launch Center\n\nNetwork: ${s.network}\nStatus: ${s.launch_status}\nLaunch date: ${s.launch_date}\n\nContract:\n${s.contract}\n\nChart:\n${s.chart}\n\nBuy:\n${s.buy}`, Markup.inlineKeyboard(rows));
  }
  if (data === 'market') return showMenu(ctx, `📊 Market\n\n💰 Price: Token is not live yet.\n📈 Chart: ${s.chart}\n🛒 Buy: ${s.buy}\n📄 Contract: ${s.contract}`, nav('home'));
  if (data === 'community') return showMenu(ctx, '🌍 Community\n\nUse only official TRINTOPE links.', Markup.inlineKeyboard([
    [url('🌐 Website', s.website), url('🐦 X', s.x)],
    ...(s.telegram_group ? [[url('💬 Group', s.telegram_group)]] : []),
    ...(s.telegram_channel ? [[url('📢 Channel', s.telegram_channel)]] : []),
    [btn('⬅️ Back', 'home'), btn('❌ Close', 'close')]
  ]));
  if (data === 'project') return showMenu(ctx, `📚 Project\n\n📢 News:\n${s.news}\n\n🗺 Roadmap:\n${s.roadmap}\n\n💎 Tokenomics:\n${s.tokenomics}`, nav('home'));
  if (data === 'help') return showMenu(ctx, '❓ Help\n\nThis is the official TRINTOPE assistant. In groups, menus are hidden to keep the chat clean.', nav('home'));

  if (data === 'admin') {
    if (!(await requireOwner(ctx))) return;
    const stats = await getStats();
    const logs = stats.logs.map(fmtLog).slice(0, 4).join('\n') || 'No recent actions.';
    return showMenu(ctx, `🔒 TRINTOPE Control Center\n\nWelcome back, Owner.\n\nManage your project from Telegram without touching GitHub or Railway.\n\nVersion: ${APP_VERSION}\nStorage: ${storageMode}\nUsers: ${stats.users}\n\nRecent actions:\n${logs}`, adminKeyboard());
  }
  if (!(await isOwnerId(userId(ctx)))) return;

  if (data === 'admin_launch') return showMenu(ctx, `🚀 Launch Center\n\nPrepare everything needed for the Solana launch from one place.\n\nNetwork: ${s.network}\nLaunch status: ${s.launch_status}\nLaunch date: ${s.launch_date}\n\nContract:\n${s.contract}\n\nChart:\n${s.chart}\n\nBuy:\n${s.buy}\n\nSolscan:\n${s.solscan}`, Markup.inlineKeyboard([
    [btn('🌐 Network', 'edit:network'), btn('📅 Launch Date', 'edit:launch_date')],
    [btn('🚦 Launch Status', 'edit:launch_status'), btn('📄 Contract', 'edit:contract')],
    [btn('📈 Chart', 'edit:chart'), btn('🛒 Buy', 'edit:buy')],
    [btn('🔎 Solscan', 'edit:solscan'), btn('🧭 DEX', 'edit:dex')],
    [btn('⬅️ Control Center', 'admin'), btn('❌ Close', 'close')]
  ]));

  if (data === 'admin_content') return showMenu(ctx, `📢 Content Manager\n\nUpdate public text shown inside the bot.\n\nWelcome:\n${s.welcome}\n\nNews:\n${s.news}\n\nFAQ:\n${s.faq}`, Markup.inlineKeyboard([
    [btn('✏️ Welcome', 'edit:welcome'), btn('✏️ News', 'edit:news')],
    [btn('✏️ FAQ', 'edit:faq'), btn('📜 Whitepaper', 'edit:whitepaper')],
    [btn('⬅️ Control Center', 'admin'), btn('❌ Close', 'close')]
  ]));

  if (data === 'admin_project') return showMenu(ctx, `🌐 Project Settings\n\n${statusIcon(s.status)} Status: ${s.status}\nWebsite: ${s.website}\nX: ${s.x}\nGroup: ${s.telegram_group || 'Not set'}\nChannel: ${s.telegram_channel || 'Not set'}\n\nRoadmap:\n${s.roadmap}\n\nTokenomics:\n${s.tokenomics}`, Markup.inlineKeyboard([
    [btn('🟢 Status', 'status_menu'), btn('🔗 Links', 'links_menu')],
    [btn('🗺 Roadmap', 'edit:roadmap'), btn('💎 Tokenomics', 'edit:tokenomics')],
    [btn('🚀 Launch Center', 'admin_launch')],
    [btn('⬅️ Control Center', 'admin'), btn('❌ Close', 'close')]
  ]));

  if (data === 'admin_stats') {
    const st = await getStats();
    const logs = st.logs.map(fmtLog).join('\n') || 'No logs yet.';
    return showMenu(ctx, `📊 Analytics\n\nUsers: ${st.users}\nOwners: ${st.owners}\nStorage: ${storageMode}\n\nLast actions:\n${logs}`, Markup.inlineKeyboard([[btn('🔄 Refresh', 'admin_stats')], [btn('⬅️ Control Center', 'admin'), btn('❌ Close', 'close')]]));
  }

  if (data === 'admin_system') return showMenu(ctx, `⚙️ System\n\nVersion: ${APP_VERSION}\nStorage: ${storageMode}\nMenu TTL: ${Math.round(MENU_TTL_MS / 1000)} sec\n\nUse this section for safe system-level changes.`, Markup.inlineKeyboard([
    [btn('📋 View Logs', 'admin_stats')],
    [btn('⬅️ Control Center', 'admin'), btn('❌ Close', 'close')]
  ]));

  if (data === 'status_menu') return showMenu(ctx, `🟢 Project Status\n\nCurrent status: ${s.status}\n\nChoose a new public status. You will be asked to confirm.`, Markup.inlineKeyboard([
    [btn('Development', 'confirm_status:Development'), btn('Testing', 'confirm_status:Testing')],
    [btn('Presale', 'confirm_status:Presale'), btn('Live', 'confirm_status:Live')],
    [btn('⬅️ Project Settings', 'admin_project'), btn('❌ Close', 'close')]
  ]));

  if (data === 'links_menu') return showMenu(ctx, '🔗 Official Links\n\nChoose what you want to update. These links are shown to users, so check them carefully.', Markup.inlineKeyboard([
    [btn('🌐 Website', 'edit:website'), btn('🐦 X', 'edit:x')],
    [btn('💬 Telegram Group', 'edit:telegram_group'), btn('📢 Telegram Channel', 'edit:telegram_channel')],
    [btn('⬅️ Project Settings', 'admin_project'), btn('❌ Close', 'close')]
  ]));

  if (data.startsWith('confirm_status:')) {
    const status = data.split(':')[1];
    return showMenu(ctx, `⚠️ Confirm status change\n\nNew public status will be:\n${statusIcon(status)} ${status}\n\nThis will be visible to users.`, Markup.inlineKeyboard([
      [btn('✅ Confirm', `status:${status}`)],
      [btn('↩️ Cancel', 'status_menu'), btn('❌ Close', 'close')]
    ]));
  }

  if (data.startsWith('status:')) {
    const status = data.split(':')[1];
    await setSetting('status', status, userId(ctx));
    return showMenu(ctx, `✅ Status updated\n\nCurrent status: ${statusIcon(status)} ${status}`, nav('admin_project'));
  }

  if (data === 'cancel_edit') {
    pendingEdit.delete(userId(ctx));
    return showMenu(ctx, '✅ Edit cancelled.', nav('admin'));
  }

  if (data.startsWith('edit:')) {
    const key = data.split(':')[1];
    if (!Object.hasOwn(DEFAULTS, key)) return;
    pendingEdit.set(userId(ctx), key);
    return showMenu(ctx, `✏️ Edit ${displayField(key)}\n\nSend the new value as your next message.\n\nTip: you can paste multiple lines for sections like Roadmap, FAQ or Tokenomics.`, Markup.inlineKeyboard([[btn('↩️ Cancel', 'cancel_edit'), btn('❌ Close', 'close')]]));
  }
});

bot.catch((err) => console.error('Bot error:', err));

await initStorage();
await bot.launch();
console.log(`✅ TRINTOPE Bot v${APP_VERSION} launched`);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
