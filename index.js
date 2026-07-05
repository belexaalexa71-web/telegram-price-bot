import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_SETUP_CODE = process.env.OWNER_SETUP_CODE || '';
const ADMIN_IDS_ENV = process.env.ADMIN_IDS || '';
const BOT_USERNAME = process.env.BOT_USERNAME || '';
const DATA_FILE = './data.json';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const defaultData = {
  ownerIds: ADMIN_IDS_ENV.split(',').map(x => x.trim()).filter(Boolean),
  users: {},
  settings: {
    status: 'Building',
    website: 'https://ea32b09e.trintope-universe.pages.dev/',
    x: 'https://x.com/AndrejK40133234',
    telegramGroup: '',
    telegramChannel: '',
    welcome: '🚀 Welcome to TRINTOPE\n\nOfficial project bot.\n\nChoose an option below.',
    news: 'No announcements yet. Follow official channels for updates.',
    roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
    tokenomics: 'Coming soon. Tokenomics will be published before launch.',
    faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen launch?\nLaunch date will be announced soon.',
    support: 'Need help? Contact us via X.',
    priceText: 'Token is not live yet. Price tracking will become available after launch.',
    chartUrl: '',
    buyUrl: ''
  },
  pending: {},
  logs: []
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) return { ...defaultData, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
  } catch (e) { console.error('Load data error:', e); }
  return structuredClone(defaultData);
}
let data = loadData();
function saveData() { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function log(userId, action) { data.logs.unshift({ time: new Date().toISOString(), userId, action }); data.logs = data.logs.slice(0, 50); saveData(); }
function isOwner(id) { return data.ownerIds.includes(String(id)); }
function isPrivate(ctx) { return ctx.chat?.type === 'private'; }
function trackUser(ctx) {
  if (!ctx.from) return;
  data.users[String(ctx.from.id)] = { id: ctx.from.id, username: ctx.from.username || '', firstName: ctx.from.first_name || '', lastSeen: new Date().toISOString() };
  saveData();
}
async function safeDelete(ctx, messageId) { try { await ctx.deleteMessage(messageId); } catch {} }
async function cleanGroupCommand(ctx) {
  if (ctx.message?.message_id) await safeDelete(ctx, ctx.message.message_id);
  const username = BOT_USERNAME || (ctx.botInfo?.username ? ctx.botInfo.username : '');
  const url = username ? `https://t.me/${username}` : undefined;
  try {
    const msg = await ctx.reply('🔒 Open the official TRINTOPE bot in private chat.', url ? Markup.inlineKeyboard([[Markup.button.url('Open Bot', url)]]) : undefined);
    setTimeout(() => safeDelete(ctx, msg.message_id), 12000);
  } catch {}
}
function backClose(back='home') { return [Markup.button.callback('⬅ Back', back), Markup.button.callback('❌ Close', 'close')]; }
function homeKeyboard(ctx) {
  const rows = [
    [Markup.button.callback('📊 Market', 'market'), Markup.button.callback('📚 Project', 'project')],
    [Markup.button.callback('🌍 Community', 'community'), Markup.button.callback('❓ FAQ', 'faq')],
    [Markup.button.callback('📞 Support', 'support'), Markup.button.callback('❌ Close', 'close')]
  ];
  if (isOwner(ctx.from.id)) rows.splice(3, 0, [Markup.button.callback('🔒 Admin Panel', 'admin')]);
  return Markup.inlineKeyboard(rows);
}
function textHome() { return `${data.settings.welcome}\n\n🟢 Status: ${data.settings.status}`; }
async function show(ctx, text, keyboard) {
  try { await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }); }
  catch { await ctx.reply(text, { parse_mode: 'HTML', ...keyboard }); }
}
const menu = {
  home: ctx => show(ctx, textHome(), homeKeyboard(ctx)),
  market: ctx => show(ctx, '📊 <b>Market</b>\n\nToken data will become available after launch.', Markup.inlineKeyboard([[Markup.button.callback('💰 Price', 'price'), Markup.button.callback('📈 Chart', 'chart')],[Markup.button.callback('🛒 Buy', 'buy')], backClose()])),
  price: ctx => show(ctx, `💰 <b>Price</b>\n\n${data.settings.priceText}`, Markup.inlineKeyboard([backClose('market')])),
  chart: ctx => show(ctx, data.settings.chartUrl ? '📈 <b>Chart</b>\n\nOpen official chart below.' : '📈 <b>Chart</b>\n\nChart will be available after launch.', Markup.inlineKeyboard([...(data.settings.chartUrl ? [[Markup.button.url('Open Chart', data.settings.chartUrl)]] : []), backClose('market')])) ,
  buy: ctx => show(ctx, data.settings.buyUrl ? '🛒 <b>Buy TRINTOPE</b>\n\nUse only official links.' : '🛒 <b>Buy</b>\n\nTrading is not available yet.', Markup.inlineKeyboard([...(data.settings.buyUrl ? [[Markup.button.url('Buy', data.settings.buyUrl)]] : []), backClose('market')])) ,
  project: ctx => show(ctx, '📚 <b>Project</b>', Markup.inlineKeyboard([[Markup.button.callback('📢 News', 'news'), Markup.button.callback('🗺 Roadmap', 'roadmap')],[Markup.button.callback('💎 Tokenomics', 'tokenomics')], backClose()])),
  news: ctx => show(ctx, `📢 <b>News</b>\n\n${data.settings.news}`, Markup.inlineKeyboard([backClose('project')])),
  roadmap: ctx => show(ctx, `🗺 <b>Roadmap</b>\n\n${data.settings.roadmap}`, Markup.inlineKeyboard([backClose('project')])),
  tokenomics: ctx => show(ctx, `💎 <b>Tokenomics</b>\n\n${data.settings.tokenomics}`, Markup.inlineKeyboard([backClose('project')])),
  community: ctx => show(ctx, '🌍 <b>Official Links</b>\n\nAlways use only official TRINTOPE links.', Markup.inlineKeyboard([[Markup.button.url('🌐 Website', data.settings.website)],[Markup.button.url('🐦 X', data.settings.x)],...(data.settings.telegramGroup ? [[Markup.button.url('💬 Group', data.settings.telegramGroup)]] : []),...(data.settings.telegramChannel ? [[Markup.button.url('📢 Channel', data.settings.telegramChannel)]] : []), backClose()])),
  faq: ctx => show(ctx, `❓ <b>FAQ</b>\n\n${data.settings.faq}`, Markup.inlineKeyboard([backClose()])),
  support: ctx => show(ctx, `📞 <b>Support</b>\n\n${data.settings.support}`, Markup.inlineKeyboard([[Markup.button.url('Contact via X', data.settings.x)], backClose()])),
  admin: ctx => {
    if (!isOwner(ctx.from.id) || !isPrivate(ctx)) return ctx.answerCbQuery('Access denied');
    return show(ctx, '🔒 <b>Admin Panel</b>\n\nManage TRINTOPE bot content from Telegram.', Markup.inlineKeyboard([[Markup.button.callback('🟢 Status', 'admin_status'), Markup.button.callback('🔗 Links', 'admin_links')],[Markup.button.callback('📢 News', 'admin_edit_news'), Markup.button.callback('🗺 Roadmap', 'admin_edit_roadmap')],[Markup.button.callback('💎 Tokenomics', 'admin_edit_tokenomics'), Markup.button.callback('❓ FAQ', 'admin_edit_faq')],[Markup.button.callback('📝 Welcome', 'admin_edit_welcome'), Markup.button.callback('📊 Stats', 'admin_stats')], backClose('home')]));
  },
  admin_status: ctx => show(ctx, '🟢 <b>Project Status</b>\n\nChoose current status.', Markup.inlineKeyboard([[Markup.button.callback('Building', 'set_status_Building'), Markup.button.callback('Presale', 'set_status_Presale'), Markup.button.callback('Live', 'set_status_Live')], backClose('admin')])),
  admin_links: ctx => show(ctx, `🔗 <b>Links</b>\n\nWebsite: ${data.settings.website}\nX: ${data.settings.x}\nGroup: ${data.settings.telegramGroup || 'not set'}\nChannel: ${data.settings.telegramChannel || 'not set'}`, Markup.inlineKeyboard([[Markup.button.callback('Edit Website', 'admin_edit_website'), Markup.button.callback('Edit X', 'admin_edit_x')],[Markup.button.callback('Edit Group', 'admin_edit_telegramGroup'), Markup.button.callback('Edit Channel', 'admin_edit_telegramChannel')], backClose('admin')])),
  admin_stats: ctx => show(ctx, `📊 <b>Stats</b>\n\nUsers: ${Object.keys(data.users).length}\nAdmin logs: ${data.logs.length}`, Markup.inlineKeyboard([backClose('admin')]))
};

bot.start(async ctx => { trackUser(ctx); if (!isPrivate(ctx)) return cleanGroupCommand(ctx); await ctx.reply(textHome(), { parse_mode: 'HTML', ...homeKeyboard(ctx) }); });
bot.command('help', async ctx => { trackUser(ctx); if (!isPrivate(ctx)) return cleanGroupCommand(ctx); await ctx.reply('Use /start to open the TRINTOPE menu.'); });
bot.command('id', async ctx => { if (!isPrivate(ctx)) return cleanGroupCommand(ctx); await ctx.reply(`Your Telegram ID: ${ctx.from.id}`); });
bot.command('setup_owner', async ctx => {
  if (!isPrivate(ctx)) return;
  const parts = ctx.message.text.split(' ');
  const code = parts.slice(1).join(' ').trim();
  if (data.ownerIds.length > 0 && !isOwner(ctx.from.id)) return ctx.reply('Owner already configured.');
  if (!OWNER_SETUP_CODE) return ctx.reply('OWNER_SETUP_CODE is not configured in Railway.');
  if (code !== OWNER_SETUP_CODE) return ctx.reply('Invalid setup code.');
  if (!data.ownerIds.includes(String(ctx.from.id))) data.ownerIds.push(String(ctx.from.id));
  log(ctx.from.id, 'Owner setup completed');
  await ctx.reply('✅ Owner access enabled. Send /start to open Admin Panel.');
});

bot.on('callback_query', async ctx => {
  trackUser(ctx);
  const action = ctx.callbackQuery.data;
  await ctx.answerCbQuery().catch(()=>{});
  if (!isPrivate(ctx)) return;
  if (action === 'close') { try { await ctx.deleteMessage(); } catch {} return; }
  if (action.startsWith('set_status_')) {
    if (!isOwner(ctx.from.id)) return;
    data.settings.status = action.replace('set_status_', ''); log(ctx.from.id, `Status changed to ${data.settings.status}`);
    return menu.admin_status(ctx);
  }
  if (action.startsWith('admin_edit_')) {
    if (!isOwner(ctx.from.id)) return;
    const key = action.replace('admin_edit_', '');
    data.pending[String(ctx.from.id)] = { type: 'edit', key };
    saveData();
    return show(ctx, `✏️ Send new value for: <b>${key}</b>\n\nSend /cancel to cancel.`, Markup.inlineKeyboard([backClose(key === 'website' || key === 'x' || key.startsWith('telegram') ? 'admin_links' : 'admin')]));
  }
  if (menu[action]) return menu[action](ctx);
});

bot.command('cancel', async ctx => { delete data.pending[String(ctx.from.id)]; saveData(); await ctx.reply('Cancelled.'); });
bot.on('text', async ctx => {
  trackUser(ctx);
  if (!isPrivate(ctx)) {
    if (ctx.message.text.startsWith('/')) return cleanGroupCommand(ctx);
    return;
  }
  const pending = data.pending[String(ctx.from.id)];
  if (pending && isOwner(ctx.from.id)) {
    const key = pending.key;
    if (Object.prototype.hasOwnProperty.call(data.settings, key)) {
      data.settings[key] = ctx.message.text.trim();
      delete data.pending[String(ctx.from.id)];
      log(ctx.from.id, `Edited ${key}`);
      saveData();
      return ctx.reply(`✅ Updated: ${key}`);
    }
  }
});

bot.catch((err) => console.error('Bot error:', err));
bot.launch();
console.log('TRINTOPE Bot is running');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
