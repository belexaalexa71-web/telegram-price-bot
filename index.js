'use strict';

const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const { Pool } = require('pg');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = String(process.env.OWNER_ID || '').trim();
const ADMIN_IDS = String(process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const DATABASE_URL = process.env.DATABASE_URL;
const GROUP_SILENT_MODE = String(process.env.GROUP_SILENT_MODE || 'true').toLowerCase() !== 'false';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is required. Add it in Railway Variables.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
let botUsername = '';
const sessions = new Map();

const DEFAULTS = {
  project_name: 'TRINTOPE',
  status: 'Building',
  website_url: 'https://ea32b09e.trintope-universe.pages.dev/',
  x_url: 'https://x.com/AndrejK40133234',
  telegram_group_url: '',
  telegram_channel_url: '',
  contract: '',
  chain: '',
  buy_url: '',
  chart_url: '',
  news: 'No announcements yet. Follow our official links for updates.',
  roadmap: '✅ Website\n✅ Telegram Bot\n✅ X\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n⬜ CEX Listing',
  tokenomics: 'Coming soon. Tokenomics will be published before launch.',
  faq: 'What is TRINTOPE?\nTRINTOPE is a community-driven Web3 project.\n\nWhen launch?\nThe official launch date will be announced soon.\n\nWhere can I buy?\nThe buy link will be available after launch.',
  support: 'Need help? Contact us through the official X account.'
};

class Store {
  constructor() {
    this.pool = null;
    this.file = path.join(__dirname, 'bot-data.json');
    this.memory = { settings: { ...DEFAULTS }, users: {} };
  }

  async init() {
    if (DATABASE_URL) {
      try {
        this.pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
        await this.pool.query('select 1');
        await this.pool.query('create table if not exists settings (key text primary key, value text not null)');
        await this.pool.query('create table if not exists users (id text primary key, username text, first_name text, updated_at timestamptz default now())');
        for (const [key, value] of Object.entries(DEFAULTS)) {
          await this.pool.query('insert into settings(key,value) values($1,$2) on conflict (key) do nothing', [key, value]);
        }
        console.log('Database connected.');
        return;
      } catch (err) {
        console.warn('Database unavailable, falling back to local file:', err.message);
        this.pool = null;
      }
    }
    this.loadFile();
  }

  loadFile() {
    try {
      if (fs.existsSync(this.file)) {
        const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        this.memory.settings = { ...DEFAULTS, ...(data.settings || {}) };
        this.memory.users = data.users || {};
      }
    } catch (err) {
      console.warn('Could not load local file store:', err.message);
    }
  }

  saveFile() {
    try { fs.writeFileSync(this.file, JSON.stringify(this.memory, null, 2)); } catch (_) {}
  }

  async getSettings() {
    if (this.pool) {
      const res = await this.pool.query('select key,value from settings');
      const out = { ...DEFAULTS };
      for (const row of res.rows) out[row.key] = row.value;
      return out;
    }
    return { ...DEFAULTS, ...this.memory.settings };
  }

  async get(key) {
    const s = await this.getSettings();
    return s[key] || '';
  }

  async set(key, value) {
    value = String(value || '');
    if (this.pool) {
      await this.pool.query('insert into settings(key,value) values($1,$2) on conflict (key) do update set value=excluded.value', [key, value]);
    } else {
      this.memory.settings[key] = value;
      this.saveFile();
    }
  }

  async addUser(user) {
    if (!user || !user.id) return;
    const id = String(user.id);
    if (this.pool) {
      await this.pool.query(
        'insert into users(id,username,first_name,updated_at) values($1,$2,$3,now()) on conflict (id) do update set username=excluded.username, first_name=excluded.first_name, updated_at=now()',
        [id, user.username || '', user.first_name || '']
      );
    } else {
      this.memory.users[id] = { username: user.username || '', first_name: user.first_name || '', updated_at: new Date().toISOString() };
      this.saveFile();
    }
  }

  async users() {
    if (this.pool) {
      const res = await this.pool.query('select id from users');
      return res.rows.map(r => r.id);
    }
    return Object.keys(this.memory.users);
  }

  async userCount() {
    if (this.pool) {
      const res = await this.pool.query('select count(*)::int as count from users');
      return res.rows[0].count;
    }
    return Object.keys(this.memory.users).length;
  }
}

const store = new Store();

function isOwner(ctx) {
  const id = String(ctx.from?.id || '');
  return id && (id === OWNER_ID || ADMIN_IDS.includes(id));
}

function esc(text) {
  return String(text || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

function shortContract(c) {
  if (!c) return '';
  return c.length > 18 ? `${c.slice(0, 8)}...${c.slice(-6)}` : c;
}

function openBotUrl() {
  return botUsername ? `https://t.me/${botUsername}` : 'https://t.me/';
}

async function safeDelete(ctx, chatId, messageId) {
  try { await ctx.telegram.deleteMessage(chatId, messageId); } catch (_) {}
}

async function deleteLater(ctx, chatId, messageId, ms = 8000) {
  setTimeout(() => safeDelete(ctx, chatId, messageId), ms).unref?.();
}

async function mainKeyboard(ctx) {
  const s = await store.getSettings();
  const rows = [
    [Markup.button.callback('💰 Price', 'price'), Markup.button.callback('📈 Chart', 'chart')],
    [Markup.button.callback('🛒 Buy', 'buy'), Markup.button.url('🌐 Website', s.website_url || DEFAULTS.website_url)],
    [Markup.button.url('🐦 X', s.x_url || DEFAULTS.x_url), Markup.button.callback('📢 News', 'news')],
    [Markup.button.callback('💎 Tokenomics', 'tokenomics'), Markup.button.callback('🗺 Roadmap', 'roadmap')],
    [Markup.button.callback('👥 Community', 'community'), Markup.button.callback('📜 Contract', 'contract')],
    [Markup.button.callback('❓ FAQ', 'faq'), Markup.button.callback('📞 Support', 'support')],
    [Markup.button.callback('🔗 Official Links', 'links')]
  ];
  if (isOwner(ctx)) rows.push([Markup.button.callback('👑 Admin Panel', 'admin')]);
  return Markup.inlineKeyboard(rows);
}

async function homeText() {
  const s = await store.getSettings();
  return `🚀 Welcome to ${esc(s.project_name)}\n\nOfficial Project Bot\n\n🟢 Status: ${esc(s.status)}\n\nChoose an option below 👇`;
}

async function sendHome(ctx, edit = false) {
  const text = await homeText();
  const keyboard = await mainKeyboard(ctx);
  if (edit && ctx.callbackQuery?.message) {
    try { return await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }); } catch (_) {}
  }
  return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

async function sectionText(key) {
  const s = await store.getSettings();
  if (key === 'price') {
    if (!s.contract) return '💰 Price\n\nToken is not live yet.\n\nPrice tracking will become available after launch.';
    return `💰 Price\n\nContract added: ${shortContract(s.contract)}\n\nAutomatic price tracking will be enabled after liquidity/trading is live.`;
  }
  if (key === 'chart') {
    if (s.chart_url) return `📈 Chart\n\nOpen chart: ${s.chart_url}`;
    if (s.contract) return `📈 Chart\n\nChart will be available after launch.\n\nContract: ${s.contract}`;
    return '📈 Chart\n\nChart will be available after launch.';
  }
  if (key === 'buy') {
    if (s.buy_url) return `🛒 Buy\n\nOfficial buy link:\n${s.buy_url}`;
    return '🛒 Buy\n\nTrading is not available yet.\n\nStay tuned for the official launch.';
  }
  if (key === 'news') return `📢 News\n\n${s.news}`;
  if (key === 'tokenomics') return `💎 Tokenomics\n\n${s.tokenomics}`;
  if (key === 'roadmap') return `🗺 Roadmap\n\n${s.roadmap}`;
  if (key === 'faq') return `❓ FAQ\n\n${s.faq}`;
  if (key === 'support') return `📞 Support\n\n${s.support}`;
  if (key === 'contract') return s.contract ? `📜 Contract\n\nChain: ${s.chain || 'Not set'}\nContract:\n${s.contract}` : '📜 Contract\n\nContract is not published yet.';
  if (key === 'community') {
    const lines = ['👥 Community\n'];
    lines.push(`🌐 Website: ${s.website_url || 'Not set'}`);
    lines.push(`🐦 X: ${s.x_url || 'Not set'}`);
    if (s.telegram_group_url) lines.push(`💬 Telegram Group: ${s.telegram_group_url}`);
    if (s.telegram_channel_url) lines.push(`📢 Telegram Channel: ${s.telegram_channel_url}`);
    return lines.join('\n');
  }
  if (key === 'links') {
    const lines = ['🔗 Official Links\n', 'Always use only official links.\n'];
    if (s.website_url) lines.push(`🌐 Website: ${s.website_url}`);
    if (s.x_url) lines.push(`🐦 X: ${s.x_url}`);
    if (s.telegram_group_url) lines.push(`💬 Telegram Group: ${s.telegram_group_url}`);
    if (s.telegram_channel_url) lines.push(`📢 Telegram Channel: ${s.telegram_channel_url}`);
    if (s.contract) lines.push(`📜 Contract: ${s.contract}`);
    return lines.join('\n');
  }
  return 'Unknown section.';
}

function backKeyboard() {
  return Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back to menu', 'home')]]);
}

async function showSection(ctx, key) {
  const text = await sectionText(key);
  try {
    await ctx.editMessageText(text, { ...backKeyboard() });
  } catch (_) {
    await ctx.reply(text, backKeyboard());
  }
}

function adminKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🟢 Status', 'admin_set_status'), Markup.button.callback('📜 Contract', 'admin_set_contract')],
    [Markup.button.callback('⛓ Chain', 'admin_set_chain'), Markup.button.callback('🛒 Buy Link', 'admin_set_buy')],
    [Markup.button.callback('📈 Chart Link', 'admin_set_chart'), Markup.button.callback('🌐 Website', 'admin_set_website')],
    [Markup.button.callback('🐦 X', 'admin_set_x'), Markup.button.callback('📢 News', 'admin_set_news')],
    [Markup.button.callback('🗺 Roadmap', 'admin_set_roadmap'), Markup.button.callback('💎 Tokenomics', 'admin_set_tokenomics')],
    [Markup.button.callback('❓ FAQ', 'admin_set_faq'), Markup.button.callback('📨 Broadcast', 'admin_broadcast')],
    [Markup.button.callback('📊 Stats', 'admin_stats'), Markup.button.callback('⚙️ Show Settings', 'admin_settings')],
    [Markup.button.callback('⬅️ User Menu', 'home')]
  ]);
}

async function sendAdmin(ctx, edit = false) {
  if (!isOwner(ctx)) return ctx.reply('Access denied.');
  const text = '👑 TRINTOPE Admin Panel\n\nManage the bot directly from Telegram.\n\nChoose what you want to edit:';
  if (edit && ctx.callbackQuery?.message) {
    try { return await ctx.editMessageText(text, adminKeyboard()); } catch (_) {}
  }
  return ctx.reply(text, adminKeyboard());
}

const fieldMap = {
  admin_set_status: ['status', 'Send new project status. Example: LIVE'],
  admin_set_contract: ['contract', 'Send token contract address.'],
  admin_set_chain: ['chain', 'Send blockchain/network. Example: Solana / BSC / Base / ETH'],
  admin_set_buy: ['buy_url', 'Send official buy link.'],
  admin_set_chart: ['chart_url', 'Send chart link.'],
  admin_set_website: ['website_url', 'Send website URL.'],
  admin_set_x: ['x_url', 'Send X/Twitter URL.'],
  admin_set_news: ['news', 'Send latest news text.'],
  admin_set_roadmap: ['roadmap', 'Send new roadmap text.'],
  admin_set_tokenomics: ['tokenomics', 'Send tokenomics text.'],
  admin_set_faq: ['faq', 'Send FAQ text.'],
  admin_broadcast: ['broadcast', 'Send message to broadcast to all bot users.']
};

async function askAdminField(ctx, action) {
  if (!isOwner(ctx)) return ctx.answerCbQuery('Access denied');
  const [field, prompt] = fieldMap[action];
  sessions.set(String(ctx.from.id), { field });
  await ctx.answerCbQuery();
  await ctx.reply(`✍️ ${prompt}\n\nSend /cancel to cancel.`);
}

async function handleAdminInput(ctx, text) {
  const id = String(ctx.from.id);
  const session = sessions.get(id);
  if (!session) return false;
  if (text === '/cancel') {
    sessions.delete(id);
    await ctx.reply('Cancelled.');
    return true;
  }
  if (session.field === 'broadcast') {
    sessions.delete(id);
    const ids = await store.users();
    let ok = 0, fail = 0;
    for (const uid of ids) {
      try { await ctx.telegram.sendMessage(uid, `📢 TRINTOPE Announcement\n\n${text}`); ok++; } catch (_) { fail++; }
    }
    await ctx.reply(`Broadcast finished.\nSent: ${ok}\nFailed: ${fail}`);
    return true;
  }
  await store.set(session.field, text);
  sessions.delete(id);
  await ctx.reply(`✅ Saved: ${session.field}\n\n${text}`, adminKeyboard());
  return true;
}

async function quickSet(ctx, field, value) {
  if (!isOwner(ctx)) return ctx.reply('Access denied.');
  if (!value) return ctx.reply(`Usage: /set${field} value`);
  await store.set(field, value);
  return ctx.reply(`✅ Saved ${field}:\n${value}`);
}

async function handleGroupCommand(ctx) {
  const chatId = ctx.chat.id;
  const messageId = ctx.message.message_id;
  if (GROUP_SILENT_MODE) await safeDelete(ctx, chatId, messageId);
  try {
    await store.addUser(ctx.from);
    await ctx.telegram.sendMessage(ctx.from.id, await homeText(), { parse_mode: 'HTML', ...(await mainKeyboard(ctx)) });
  } catch (_) {
    const msg = await ctx.reply('Open the TRINTOPE bot in private chat 👇', Markup.inlineKeyboard([
      [Markup.button.url('🚀 Open TRINTOPE Bot', openBotUrl())]
    ]));
    await deleteLater(ctx, chatId, msg.message_id, 8000);
  }
}

bot.use(async (ctx, next) => {
  try {
    if (ctx.from) await store.addUser(ctx.from);
  } catch (_) {}
  return next();
});

bot.start(async (ctx) => {
  if (ctx.chat.type !== 'private') return handleGroupCommand(ctx);
  await sendHome(ctx);
});

bot.command('myid', async (ctx) => {
  if (ctx.chat.type !== 'private') return handleGroupCommand(ctx);
  await ctx.reply(`Your Telegram ID:\n${ctx.from.id}`);
});

bot.command('admin', async (ctx) => {
  if (ctx.chat.type !== 'private') return handleGroupCommand(ctx);
  await sendAdmin(ctx);
});

bot.command('settings', async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply('Access denied.');
  const s = await store.getSettings();
  await ctx.reply(Object.entries(s).map(([k,v]) => `${k}: ${v || '-'}`).join('\n').slice(0, 3900));
});

bot.command('setcontract', async ctx => quickSet(ctx, 'contract', ctx.message.text.replace('/setcontract', '').trim()));
bot.command('setchain', async ctx => quickSet(ctx, 'chain', ctx.message.text.replace('/setchain', '').trim()));
bot.command('setbuy', async ctx => quickSet(ctx, 'buy_url', ctx.message.text.replace('/setbuy', '').trim()));
bot.command('setchart', async ctx => quickSet(ctx, 'chart_url', ctx.message.text.replace('/setchart', '').trim()));
bot.command('setwebsite', async ctx => quickSet(ctx, 'website_url', ctx.message.text.replace('/setwebsite', '').trim()));
bot.command('setx', async ctx => quickSet(ctx, 'x_url', ctx.message.text.replace('/setx', '').trim()));
bot.command('setstatus', async ctx => quickSet(ctx, 'status', ctx.message.text.replace('/setstatus', '').trim()));
bot.command('setnews', async ctx => quickSet(ctx, 'news', ctx.message.text.replace('/setnews', '').trim()));

bot.command(['price','chart','buy','links','help'], async (ctx) => {
  if (ctx.chat.type !== 'private') return handleGroupCommand(ctx);
  const cmd = ctx.message.text.split(/\s+/)[0].replace('/','').split('@')[0];
  if (cmd === 'help') return showSection(ctx, 'support');
  return showSection(ctx, cmd === 'links' ? 'links' : cmd);
});

bot.on('text', async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next();
  const text = ctx.message.text.trim();
  if (await handleAdminInput(ctx, text)) return;
  return next();
});

bot.on('message', async (ctx, next) => {
  if (ctx.chat?.type !== 'private' && ctx.message?.text?.startsWith('/')) {
    return handleGroupCommand(ctx);
  }
  return next();
});

bot.action('home', async ctx => { await ctx.answerCbQuery(); await sendHome(ctx, true); });
bot.action('admin', async ctx => { await ctx.answerCbQuery(); await sendAdmin(ctx, true); });

for (const key of ['price','chart','buy','news','tokenomics','roadmap','faq','support','contract','community','links']) {
  bot.action(key, async ctx => {
    if (ctx.chat?.type !== 'private') {
      await ctx.answerCbQuery('Open the bot in private chat.', { show_alert: false });
      try { await ctx.deleteMessage(); } catch (_) {}
      return;
    }
    await ctx.answerCbQuery();
    await showSection(ctx, key);
  });
}

for (const action of Object.keys(fieldMap)) {
  bot.action(action, ctx => askAdminField(ctx, action));
}

bot.action('admin_stats', async ctx => {
  if (!isOwner(ctx)) return ctx.answerCbQuery('Access denied');
  const count = await store.userCount();
  await ctx.answerCbQuery();
  await ctx.reply(`📊 Bot Stats\n\nUsers who opened bot: ${count}\nOwner ID configured: ${OWNER_ID ? 'yes' : 'no'}\nDatabase: ${store.pool ? 'Postgres' : 'local fallback'}`);
});

bot.action('admin_settings', async ctx => {
  if (!isOwner(ctx)) return ctx.answerCbQuery('Access denied');
  const s = await store.getSettings();
  await ctx.answerCbQuery();
  await ctx.reply(Object.entries(s).map(([k,v]) => `${k}: ${v || '-'}`).join('\n').slice(0, 3900));
});

bot.catch((err, ctx) => {
  console.error('Bot error:', err && err.stack ? err.stack : err);
});

(async () => {
  await store.init();
  const me = await bot.telegram.getMe();
  botUsername = me.username;
  await bot.launch({ dropPendingUpdates: true });
  console.log('TRINTOPE Bot v3.0.0-final-fixed is running.');
  console.log('Bot username:', botUsername);
  console.log('Group silent mode:', GROUP_SILENT_MODE);
  console.log('Owner configured:', OWNER_ID ? 'yes' : 'no');
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
