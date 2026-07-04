const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  status: 'Building',
  website: 'https://ea32b09e.trintope-universe.pages.dev/',
  x: 'https://x.com/AndrejK40133234',
  telegram: '',
  news: 'No announcements yet.',
  tokenomics: 'Coming soon. Tokenomics will be published before launch.',
  roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n⬜ CEX Listing',
  faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen will the token launch?\nThe launch date will be announced soon.\n\nWhere can I buy it?\nThe buy link will be available after launch.',
  support: 'Contact us via official X account.',
  users: []
};

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to load data.json:', err);
    return { ...defaultData };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function isAdmin(ctx) {
  return ADMIN_IDS.includes(String(ctx.from?.id));
}

function rememberUser(ctx) {
  const data = loadData();
  const id = String(ctx.from?.id || '');
  if (id && !data.users.includes(id)) {
    data.users.push(id);
    saveData(data);
  }
}

async function safeDelete(ctx, messageId) {
  try { await ctx.deleteMessage(messageId); } catch (_) {}
}

async function cleanUserCommand(ctx) {
  if (ctx.chat?.type !== 'private' && ctx.message?.message_id) {
    await safeDelete(ctx, ctx.message.message_id);
  }
}

function homeKeyboard(admin = false) {
  const rows = [
    [Markup.button.callback('💰 Market', 'market'), Markup.button.callback('🌍 Community', 'community')],
    [Markup.button.callback('📚 Project', 'project'), Markup.button.callback('⚙️ More', 'more')],
    [Markup.button.callback('❌ Close', 'close')]
  ];
  if (admin) rows.splice(2, 0, [Markup.button.callback('🔒 Admin Panel', 'admin')]);
  return Markup.inlineKeyboard(rows);
}

function backKeyboard(section = 'home') {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back', section), Markup.button.callback('🏠 Home', 'home')],
    [Markup.button.callback('❌ Close', 'close')]
  ]);
}

function linkKeyboard(label, url, backTo = 'home') {
  return Markup.inlineKeyboard([
    [Markup.button.url(label, url)],
    [Markup.button.callback('⬅️ Back', backTo), Markup.button.callback('🏠 Home', 'home')],
    [Markup.button.callback('❌ Close', 'close')]
  ]);
}

function homeText() {
  const data = loadData();
  return `🚀 TRINTOPE\n\nOfficial Project Bot\n\n🟢 Status: ${data.status}\n\nChoose an option below 👇`;
}

async function editOrReply(ctx, text, keyboard) {
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
    }
  } catch (err) {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

bot.start(async (ctx) => {
  rememberUser(ctx);
  await cleanUserCommand(ctx);
  await ctx.reply(homeText(), { parse_mode: 'HTML', ...homeKeyboard(isAdmin(ctx)) });
});

bot.command('help', async (ctx) => {
  rememberUser(ctx);
  await cleanUserCommand(ctx);
  await ctx.reply('❓ Help\n\nUse /start to open the TRINTOPE bot menu.\nAll project sections are available through buttons.', backKeyboard('home'));
});

bot.command('id', async (ctx) => {
  await ctx.reply(`Your Telegram ID:\n${ctx.from.id}`);
});

bot.action('home', async (ctx) => editOrReply(ctx, homeText(), homeKeyboard(isAdmin(ctx))));

bot.action('market', async (ctx) => editOrReply(ctx, '💰 Market\n\nChoose a market section:', Markup.inlineKeyboard([
  [Markup.button.callback('💰 Price', 'price'), Markup.button.callback('📈 Chart', 'chart')],
  [Markup.button.callback('🛒 Buy', 'buy')],
  [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]
])));

bot.action('price', async (ctx) => editOrReply(ctx, '💰 Price\n\nToken is not live yet.\n\nPrice tracking will become available after launch.', backKeyboard('market')));
bot.action('chart', async (ctx) => editOrReply(ctx, '📈 Chart\n\nChart will be available after launch.', backKeyboard('market')));
bot.action('buy', async (ctx) => editOrReply(ctx, '🛒 Buy\n\nTrading is not available yet.\n\nStay tuned.', backKeyboard('market')));

bot.action('community', async (ctx) => editOrReply(ctx, '🌍 Community\n\nChoose official resource:', Markup.inlineKeyboard([
  [Markup.button.callback('🌐 Website', 'website'), Markup.button.callback('🐦 X', 'x')],
  [Markup.button.callback('👥 Telegram', 'telegram')],
  [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]
])));

bot.action('website', async (ctx) => {
  const data = loadData();
  await editOrReply(ctx, '🌐 Official Website\n\nAlways use only official links.', linkKeyboard('Open Website', data.website, 'community'));
});
bot.action('x', async (ctx) => {
  const data = loadData();
  await editOrReply(ctx, '🐦 Official X\n\nFollow TRINTOPE updates.', linkKeyboard('Open X', data.x, 'community'));
});
bot.action('telegram', async (ctx) => {
  const data = loadData();
  if (!data.telegram) return editOrReply(ctx, '👥 Telegram\n\nOfficial Telegram link will be added soon.', backKeyboard('community'));
  await editOrReply(ctx, '👥 Official Telegram\n\nJoin the community.', linkKeyboard('Open Telegram', data.telegram, 'community'));
});

bot.action('project', async (ctx) => editOrReply(ctx, '📚 Project\n\nChoose a project section:', Markup.inlineKeyboard([
  [Markup.button.callback('📢 News', 'news'), Markup.button.callback('🗺 Roadmap', 'roadmap')],
  [Markup.button.callback('💎 Tokenomics', 'tokenomics'), Markup.button.callback('📜 Whitepaper', 'whitepaper')],
  [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]
])));

bot.action('news', async (ctx) => editOrReply(ctx, `📢 News\n\n${loadData().news}`, backKeyboard('project')));
bot.action('roadmap', async (ctx) => editOrReply(ctx, `🗺 Roadmap\n\n${loadData().roadmap}`, backKeyboard('project')));
bot.action('tokenomics', async (ctx) => editOrReply(ctx, `💎 Tokenomics\n\n${loadData().tokenomics}`, backKeyboard('project')));
bot.action('whitepaper', async (ctx) => editOrReply(ctx, '📜 Whitepaper\n\nComing soon.', backKeyboard('project')));

bot.action('more', async (ctx) => editOrReply(ctx, '⚙️ More\n\nChoose a section:', Markup.inlineKeyboard([
  [Markup.button.callback('❓ FAQ', 'faq'), Markup.button.callback('📞 Support', 'support')],
  [Markup.button.callback('✅ Official Links', 'official_links')],
  [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]
])));

bot.action('faq', async (ctx) => editOrReply(ctx, `❓ FAQ\n\n${loadData().faq}`, backKeyboard('more')));
bot.action('support', async (ctx) => editOrReply(ctx, `📞 Support\n\n${loadData().support}`, backKeyboard('more')));
bot.action('official_links', async (ctx) => {
  const d = loadData();
  await editOrReply(ctx, `✅ Official Links\n\n🌐 Website:\n${d.website}\n\n🐦 X:\n${d.x}\n\nOnly trust links from this bot and official TRINTOPE channels.`, backKeyboard('more'));
});

bot.action('admin', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Access denied', { show_alert: true });
  await editOrReply(ctx, '🔒 Admin Panel\n\nOwner-only control panel.\n\nChoose an action:', Markup.inlineKeyboard([
    [Markup.button.callback('📊 Statistics', 'admin_stats'), Markup.button.callback('🟢 Status', 'admin_status')],
    [Markup.button.callback('🔗 Links', 'admin_links'), Markup.button.callback('📢 News', 'admin_news')],
    [Markup.button.callback('🗺 Roadmap', 'admin_roadmap'), Markup.button.callback('💎 Tokenomics', 'admin_tokenomics')],
    [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]
  ]));
});

bot.action('admin_stats', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Access denied', { show_alert: true });
  const data = loadData();
  await editOrReply(ctx, `📊 Statistics\n\nUsers tracked: ${data.users.length}\nStatus: ${data.status}`, backKeyboard('admin'));
});

bot.action('admin_status', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Access denied', { show_alert: true });
  await editOrReply(ctx, '🟢 Change Status\n\nUse one of these commands in private chat with bot:\n\n/setstatus Building\n/setstatus Presale\n/setstatus Live', backKeyboard('admin'));
});

bot.action('admin_links', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Access denied', { show_alert: true });
  await editOrReply(ctx, '🔗 Edit Links\n\nUse commands in private chat:\n\n/setwebsite https://example.com\n/setx https://x.com/example\n/settelegram https://t.me/example', backKeyboard('admin'));
});

bot.action('admin_news', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Access denied', { show_alert: true });
  await editOrReply(ctx, '📢 Edit News\n\nUse this command in private chat:\n\n/setnews Your announcement text', backKeyboard('admin'));
});

bot.action('admin_roadmap', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Access denied', { show_alert: true });
  await editOrReply(ctx, '🗺 Edit Roadmap\n\nUse this command in private chat:\n\n/setroadmap Your roadmap text', backKeyboard('admin'));
});

bot.action('admin_tokenomics', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Access denied', { show_alert: true });
  await editOrReply(ctx, '💎 Edit Tokenomics\n\nUse this command in private chat:\n\n/settokenomics Your tokenomics text', backKeyboard('admin'));
});

function adminTextCommand(command, updater) {
  bot.command(command, async (ctx) => {
    if (!isAdmin(ctx)) return;
    if (ctx.chat.type !== 'private') return ctx.reply('For security, admin commands work only in private chat.');
    const text = ctx.message.text.replace('/' + command, '').trim();
    if (!text) return ctx.reply('Text is missing.');
    const data = loadData();
    updater(data, text);
    saveData(data);
    await ctx.reply('✅ Updated successfully.');
  });
}

adminTextCommand('setstatus', (d, t) => d.status = t);
adminTextCommand('setwebsite', (d, t) => d.website = t);
adminTextCommand('setx', (d, t) => d.x = t);
adminTextCommand('settelegram', (d, t) => d.telegram = t);
adminTextCommand('setnews', (d, t) => d.news = t);
adminTextCommand('setroadmap', (d, t) => d.roadmap = t);
adminTextCommand('settokenomics', (d, t) => d.tokenomics = t);

bot.action('close', async (ctx) => {
  try { await ctx.deleteMessage(); } catch (_) {}
});

bot.on('callback_query', async (ctx) => {
  try { await ctx.answerCbQuery(); } catch (_) {}
});

bot.launch();
console.log('TRINTOPE bot is running');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
