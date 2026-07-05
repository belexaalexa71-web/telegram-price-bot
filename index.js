'use strict';

const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = String(process.env.OWNER_ID || '').trim();
const ADMIN_IDS = String(process.env.ADMIN_IDS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);
const DATABASE_URL = process.env.DATABASE_URL;
const APP_VERSION = '3.0.0-final';

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is missing. Add BOT_TOKEN in Railway Variables.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const sessions = new Map();
let pool = null;
let useDb = false;

const defaultSettings = {
  projectName: 'TRINTOPE',
  status: 'Building',
  websiteUrl: 'https://ea32b09e.trintope-universe.pages.dev/',
  xUrl: 'https://x.com/AndrejK40133234',
  telegramGroupUrl: '',
  telegramChannelUrl: '',
  chain: 'Not selected yet',
  contract: '',
  buyUrl: '',
  chartUrl: '',
  news: 'No announcements yet. Follow X for updates.',
  roadmap: '✅ Website\n✅ Telegram Bot\n✅ X\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n⬜ CEX Listing',
  tokenomics: 'Coming soon. Tokenomics will be published before launch.',
  faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen will the token launch?\nThe launch date will be announced soon.\n\nWhere can I buy it?\nThe buy link will be available after launch.',
  support: 'Need help? Contact us via X.',
};

const localFile = path.join(__dirname, 'bot-data.json');
let localData = { settings: defaultSettings, users: {}, admins: {} };

function ownerAndAdmins() {
  const ids = new Set([...ADMIN_IDS]);
  if (OWNER_ID) ids.add(OWNER_ID);
  for (const id of Object.keys(localData.admins || {})) ids.add(String(id));
  return ids;
}

function isOwner(ctx) {
  return OWNER_ID && String(ctx.from?.id) === OWNER_ID;
}

function isAdmin(ctx) {
  return ownerAndAdmins().has(String(ctx.from?.id));
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function initStorage() {
  if (DATABASE_URL) {
    try {
      pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await pool.query(`CREATE TABLE IF NOT EXISTS bot_kv (key TEXT PRIMARY KEY, value JSONB NOT NULL)`);
      await pool.query(`CREATE TABLE IF NOT EXISTS bot_users (id TEXT PRIMARY KEY, username TEXT, first_name TEXT, last_seen TIMESTAMPTZ DEFAULT NOW())`);
      const result = await pool.query('SELECT value FROM bot_kv WHERE key=$1', ['settings']);
      if (result.rows.length === 0) {
        await pool.query('INSERT INTO bot_kv(key, value) VALUES($1, $2)', ['settings', defaultSettings]);
      }
      useDb = true;
      console.log('Storage: PostgreSQL enabled.');
      return;
    } catch (e) {
      console.error('PostgreSQL disabled, fallback to local JSON:', e.message);
    }
  }

  try {
    if (fs.existsSync(localFile)) {
      localData = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      localData.settings = { ...defaultSettings, ...(localData.settings || {}) };
      localData.users = localData.users || {};
      localData.admins = localData.admins || {};
    } else {
      fs.writeFileSync(localFile, JSON.stringify(localData, null, 2));
    }
    console.log('Storage: local JSON enabled.');
  } catch (e) {
    console.error('Local storage error:', e.message);
  }
}

async function getSettings() {
  if (useDb) {
    const r = await pool.query('SELECT value FROM bot_kv WHERE key=$1', ['settings']);
    return { ...defaultSettings, ...(r.rows[0]?.value || {}) };
  }
  return { ...defaultSettings, ...(localData.settings || {}) };
}

async function saveSettings(settings) {
  const merged = { ...defaultSettings, ...settings };
  if (useDb) {
    await pool.query(
      `INSERT INTO bot_kv(key, value) VALUES($1, $2)
       ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`,
      ['settings', merged]
    );
  } else {
    localData.settings = merged;
    fs.writeFileSync(localFile, JSON.stringify(localData, null, 2));
  }
}

async function trackUser(ctx) {
  if (!ctx.from) return;
  const id = String(ctx.from.id);
  if (useDb) {
    await pool.query(
      `INSERT INTO bot_users(id, username, first_name, last_seen) VALUES($1,$2,$3,NOW())
       ON CONFLICT(id) DO UPDATE SET username=EXCLUDED.username, first_name=EXCLUDED.first_name, last_seen=NOW()`,
      [id, ctx.from.username || '', ctx.from.first_name || '']
    );
  } else {
    localData.users[id] = { username: ctx.from.username || '', first_name: ctx.from.first_name || '', last_seen: new Date().toISOString() };
    fs.writeFileSync(localFile, JSON.stringify(localData, null, 2));
  }
}

async function getUserIds() {
  if (useDb) {
    const r = await pool.query('SELECT id FROM bot_users');
    return r.rows.map((x) => x.id);
  }
  return Object.keys(localData.users || {});
}

async function addAdminId(id) {
  localData.admins[String(id)] = true;
  if (!useDb) fs.writeFileSync(localFile, JSON.stringify(localData, null, 2));
}

function isPrivate(ctx) {
  return ctx.chat?.type === 'private';
}

async function deleteIfGroup(ctx) {
  if (ctx.chat && ctx.chat.type !== 'private' && ctx.message?.message_id) {
    try { await ctx.deleteMessage(ctx.message.message_id); } catch (_) {}
    return true;
  }
  return false;
}

function mainKeyboard(s) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💰 Price', 'price'), Markup.button.callback('📈 Chart', 'chart')],
    [Markup.button.callback('🛒 Buy', 'buy'), Markup.button.url('🌐 Website', s.websiteUrl)],
    [Markup.button.url('🐦 X', s.xUrl), Markup.button.callback('❓ Help', 'help')],
    [Markup.button.callback('📢 News', 'news'), Markup.button.callback('🗺 Roadmap', 'roadmap')],
    [Markup.button.callback('💎 Tokenomics', 'tokenomics'), Markup.button.callback('👥 Community', 'community')],
    [Markup.button.callback('📞 Support', 'support'), Markup.button.callback('🔗 Official Links', 'links')],
  ]);
}

async function showHome(ctx, edit = false) {
  const s = await getSettings();
  const text = `🚀 <b>Welcome to ${esc(s.projectName)}</b>\n\nOfficial Project Bot\n\n🟢 <b>Status:</b> ${esc(s.status)}\n\nChoose an option below 👇`;
  const kb = mainKeyboard(s);
  if (edit && ctx.callbackQuery) {
    try { return await ctx.editMessageText(text, { parse_mode: 'HTML', ...kb }); } catch (_) {}
  }
  return ctx.reply(text, { parse_mode: 'HTML', ...kb });
}

async function sendPanel(ctx, title, body, buttons = []) {
  const s = await getSettings();
  const back = [Markup.button.callback('🏠 Home', 'home')];
  const keyboard = Markup.inlineKeyboard([...buttons, back]);
  const text = `<b>${esc(title)}</b>\n\n${esc(body)}`;
  if (ctx.callbackQuery) {
    try { return await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }); } catch (_) {}
  }
  return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

function adminKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🟢 Status', 'admin_set_status'), Markup.button.callback('🪙 Contract', 'admin_set_contract')],
    [Markup.button.callback('⛓ Chain', 'admin_set_chain'), Markup.button.callback('🛒 Buy Link', 'admin_set_buy')],
    [Markup.button.callback('📈 Chart Link', 'admin_set_chart'), Markup.button.callback('🌐 Website', 'admin_set_website')],
    [Markup.button.callback('🐦 X', 'admin_set_x'), Markup.button.callback('📢 News', 'admin_set_news')],
    [Markup.button.callback('🗺 Roadmap', 'admin_set_roadmap'), Markup.button.callback('💎 Tokenomics', 'admin_set_tokenomics')],
    [Markup.button.callback('❓ FAQ', 'admin_set_faq'), Markup.button.callback('📞 Support', 'admin_set_support')],
    [Markup.button.callback('👥 Community Links', 'admin_set_community'), Markup.button.callback('📊 Stats', 'admin_stats')],
    [Markup.button.callback('📨 Broadcast', 'admin_broadcast'), Markup.button.callback('🏠 User Menu', 'home')],
  ]);
}

async function showAdmin(ctx) {
  if (!isAdmin(ctx)) return ctx.reply('Access denied.');
  const s = await getSettings();
  const userCount = (await getUserIds()).length;
  const text = `👑 <b>TRINTOPE Admin Panel</b>\n\nVersion: ${APP_VERSION}\nStatus: ${esc(s.status)}\nChain: ${esc(s.chain)}\nContract: ${s.contract ? esc(s.contract) : 'not set'}\nUsers: ${userCount}\n\nChoose what to edit:`;
  return ctx.reply(text, { parse_mode: 'HTML', ...adminKeyboard() });
}

const setActions = {
  admin_set_status: ['status', 'Send new project status, for example: Building, Presale, LIVE'],
  admin_set_contract: ['contract', 'Send token contract address. It will be used in Price, Chart, Buy and Official Links.'],
  admin_set_chain: ['chain', 'Send blockchain name, for example: Solana, BNB Chain, Ethereum, Base, TON'],
  admin_set_buy: ['buyUrl', 'Send Buy link. If token is not live yet, send: empty'],
  admin_set_chart: ['chartUrl', 'Send Chart link. If not ready, send: empty'],
  admin_set_website: ['websiteUrl', 'Send official Website URL'],
  admin_set_x: ['xUrl', 'Send official X URL'],
  admin_set_news: ['news', 'Send latest news text'],
  admin_set_roadmap: ['roadmap', 'Send Roadmap text'],
  admin_set_tokenomics: ['tokenomics', 'Send Tokenomics text'],
  admin_set_faq: ['faq', 'Send FAQ text'],
  admin_set_support: ['support', 'Send Support text'],
};

bot.use(async (ctx, next) => {
  try { await trackUser(ctx); } catch (_) {}
  return next();
});

bot.start(async (ctx) => {
  const inGroup = await deleteIfGroup(ctx);
  if (inGroup) {
    try {
      await ctx.telegram.sendMessage(ctx.from.id, '🚀 Open TRINTOPE Bot:', mainKeyboard(await getSettings()));
    } catch (_) {
      const msg = await ctx.reply('Open TRINTOPE Bot in private chat.', Markup.inlineKeyboard([
        [Markup.button.url('🚀 Open TRINTOPE Bot', `https://t.me/${ctx.botInfo.username}`)],
      ]));
      setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 8000);
    }
    return;
  }
  return showHome(ctx);
});

bot.command('myid', async (ctx) => {
  await deleteIfGroup(ctx);
  return ctx.reply(`Your Telegram ID:\n${ctx.from.id}`);
});

bot.command('admin', async (ctx) => {
  await deleteIfGroup(ctx);
  if (!isPrivate(ctx)) return;
  return showAdmin(ctx);
});

bot.command('setcontract', async (ctx) => {
  await deleteIfGroup(ctx);
  if (!isAdmin(ctx)) return ctx.reply('Access denied.');
  const contract = (ctx.message.text || '').replace('/setcontract', '').trim();
  if (!contract) return ctx.reply('Usage:\n/setcontract CONTRACT_ADDRESS');
  const s = await getSettings();
  s.contract = contract;
  await saveSettings(s);
  return ctx.reply('✅ Contract saved. It now appears in official links, price and buy sections.');
});

bot.command(['price', 'chart', 'buy', 'links', 'help'], async (ctx) => {
  const inGroup = await deleteIfGroup(ctx);
  if (inGroup) return;
  const cmd = ctx.message.text.split(' ')[0].replace('/', '');
  return handleCallbackLike(ctx, cmd);
});

async function handleCallbackLike(ctx, action) {
  const s = await getSettings();
  switch (action) {
    case 'home': return showHome(ctx, true);
    case 'price': {
      const body = s.contract
        ? `Contract is set.\n\nChain: ${s.chain}\nContract: ${s.contract}\n\nAutomatic price tracking will be connected after liquidity/trading is live.`
        : 'Token is not live yet. Price tracking will become available after launch.';
      return sendPanel(ctx, '💰 Price', body);
    }
    case 'chart': {
      if (s.chartUrl) return sendPanel(ctx, '📈 Chart', 'Open the chart using the button below.', [[Markup.button.url('📈 Open Chart', s.chartUrl)]]);
      return sendPanel(ctx, '📈 Chart', 'Chart will be available after launch.');
    }
    case 'buy': {
      if (s.buyUrl) return sendPanel(ctx, '🛒 Buy', 'Use only the official buy link below.', [[Markup.button.url('🛒 Buy Token', s.buyUrl)]]);
      return sendPanel(ctx, '🛒 Buy', 'Trading is not available yet. Stay tuned for the official launch.');
    }
    case 'news': return sendPanel(ctx, '📢 News', s.news);
    case 'roadmap': return sendPanel(ctx, '🗺 Roadmap', s.roadmap);
    case 'tokenomics': return sendPanel(ctx, '💎 Tokenomics', s.tokenomics);
    case 'faq': return sendPanel(ctx, '❓ FAQ', s.faq);
    case 'support': return sendPanel(ctx, '📞 Support', s.support);
    case 'community': {
      const lines = [
        s.telegramGroupUrl ? `Telegram Group: ${s.telegramGroupUrl}` : 'Telegram Group: coming soon',
        s.telegramChannelUrl ? `Telegram Channel: ${s.telegramChannelUrl}` : 'Telegram Channel: coming soon',
        `Website: ${s.websiteUrl}`,
        `X: ${s.xUrl}`,
      ].join('\n');
      return sendPanel(ctx, '👥 Community', lines);
    }
    case 'links': {
      const lines = [
        `Website: ${s.websiteUrl}`,
        `X: ${s.xUrl}`,
        s.telegramGroupUrl ? `Telegram Group: ${s.telegramGroupUrl}` : null,
        s.telegramChannelUrl ? `Telegram Channel: ${s.telegramChannelUrl}` : null,
        s.contract ? `Contract: ${s.contract}` : 'Contract: not published yet',
        s.buyUrl ? `Buy: ${s.buyUrl}` : 'Buy: not available yet',
        s.chartUrl ? `Chart: ${s.chartUrl}` : 'Chart: not available yet',
      ].filter(Boolean).join('\n');
      return sendPanel(ctx, '🔗 Official Links', lines);
    }
    case 'help': return sendPanel(ctx, '❓ Help', 'This is the official TRINTOPE bot. Use it to access official project links, token information, chart, buy links and updates.');
    default: return showHome(ctx, true);
  }
}

bot.action(Object.keys(setActions), async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  if (!isAdmin(ctx)) return ctx.reply('Access denied.');
  const [key, prompt] = setActions[ctx.callbackQuery.data];
  sessions.set(String(ctx.from.id), { mode: 'set', key });
  return ctx.reply(`✏️ ${prompt}\n\nSend the new value now. Send /cancel to cancel.`);
});

bot.action('admin_set_community', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  if (!isAdmin(ctx)) return ctx.reply('Access denied.');
  sessions.set(String(ctx.from.id), { mode: 'community_group' });
  return ctx.reply('Send Telegram Group link first. Send empty if not ready. Send /cancel to cancel.');
});

bot.action('admin_stats', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  if (!isAdmin(ctx)) return ctx.reply('Access denied.');
  const ids = await getUserIds();
  return ctx.reply(`📊 Bot statistics\n\nUsers saved: ${ids.length}\nVersion: ${APP_VERSION}`);
});

bot.action('admin_broadcast', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  if (!isAdmin(ctx)) return ctx.reply('Access denied.');
  sessions.set(String(ctx.from.id), { mode: 'broadcast' });
  return ctx.reply('Send broadcast message. It will be sent to all users who opened the bot. Send /cancel to cancel.');
});

bot.action(['home','price','chart','buy','news','roadmap','tokenomics','faq','support','community','links','help'], async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  return handleCallbackLike(ctx, ctx.callbackQuery.data);
});

bot.command('cancel', async (ctx) => {
  sessions.delete(String(ctx.from.id));
  return ctx.reply('Cancelled.');
});

bot.on('text', async (ctx) => {
  if (!isPrivate(ctx)) return deleteIfGroup(ctx);
  const id = String(ctx.from.id);
  const session = sessions.get(id);
  if (!session) return;
  if (!isAdmin(ctx)) return ctx.reply('Access denied.');

  const text = ctx.message.text.trim();
  if (text === '/cancel') {
    sessions.delete(id);
    return ctx.reply('Cancelled.');
  }

  const settings = await getSettings();
  if (session.mode === 'set') {
    settings[session.key] = text.toLowerCase() === 'empty' ? '' : text;
    await saveSettings(settings);
    sessions.delete(id);
    return ctx.reply('✅ Saved.');
  }

  if (session.mode === 'community_group') {
    settings.telegramGroupUrl = text.toLowerCase() === 'empty' ? '' : text;
    sessions.set(id, { mode: 'community_channel' });
    await saveSettings(settings);
    return ctx.reply('Now send Telegram Channel link. Send empty if not ready.');
  }

  if (session.mode === 'community_channel') {
    settings.telegramChannelUrl = text.toLowerCase() === 'empty' ? '' : text;
    await saveSettings(settings);
    sessions.delete(id);
    return ctx.reply('✅ Community links saved.');
  }

  if (session.mode === 'broadcast') {
    const ids = await getUserIds();
    let ok = 0;
    for (const uid of ids) {
      try { await ctx.telegram.sendMessage(uid, `📢 TRINTOPE Update\n\n${text}`); ok++; } catch (_) {}
    }
    sessions.delete(id);
    return ctx.reply(`✅ Broadcast finished. Sent: ${ok}/${ids.length}`);
  }
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

(async () => {
  await initStorage();
  const info = await bot.telegram.getMe();
  console.log(`TRINTOPE Bot v${APP_VERSION} is running. Group silent mode: true`);
  console.log(`Bot username: @${info.username}`);
  if (!OWNER_ID) console.warn('WARNING: OWNER_ID is empty. /admin will not be available until OWNER_ID is set.');
  await bot.launch();
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
