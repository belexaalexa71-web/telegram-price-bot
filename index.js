const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = process.env.X_URL || 'https://x.com/AndrejK40133234';
const PROJECT_STATUS = process.env.PROJECT_STATUS || 'Building';

if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN environment variable');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const sessions = new Map();
const AUTO_CLOSE_MS = 3 * 60 * 1000;

function isAdmin(ctx) {
  return ADMIN_IDS.includes(String(ctx.from?.id));
}

function isPrivate(ctx) {
  return ctx.chat?.type === 'private';
}

function mainMenu(ctx) {
  const rows = [
    [Markup.button.callback('📊 Market', 'menu_market'), Markup.button.callback('🌍 Community', 'menu_community')],
    [Markup.button.callback('📚 Project', 'menu_project'), Markup.button.callback('⚙️ More', 'menu_more')],
    [Markup.button.url('🌐 Website', WEBSITE_URL), Markup.button.url('🐦 X', X_URL)],
  ];
  if (isAdmin(ctx)) rows.push([Markup.button.callback('🔒 Admin Panel', 'admin_home')]);
  rows.push([Markup.button.callback('❌ Close', 'close')]);
  return Markup.inlineKeyboard(rows);
}

const texts = {
  home: () => `🚀 TRINTOPE\n\nOfficial Project Bot\n\n🟢 Status: ${PROJECT_STATUS}\n\nUse this private menu to access official links and project information.`,
  market: () => '📊 Market\n\n💰 Price — token is not live yet.\n📈 Chart — available after launch.\n🛒 Buy — trading is not available yet.',
  community: () => `🌍 Community\n\nUse only official TRINTOPE links.\n\n🌐 Website: ${WEBSITE_URL}\n🐦 X: ${X_URL}`,
  project: () => '📚 Project\n\n🗺 Roadmap\n✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n\n💎 Tokenomics\nComing soon.',
  more: () => '⚙️ More\n\n❓ FAQ\nWhat is TRINTOPE?\nA community-driven Web3 project.\n\nWhen launch?\nLaunch date will be announced soon.\n\n📞 Support\nContact us through official X.',
  admin: () => '🔒 Admin Panel\n\nOnly authorized admins can see this panel.\n\nAvailable now:\n• View admin access\n• Check bot status\n• Keep group clean\n\nNext update:\n• Edit status\n• Publish news\n• Update links',
};

function navKeyboard(section, ctx) {
  if (section === 'market') return Markup.inlineKeyboard([
    [Markup.button.callback('💰 Price', 'market_price'), Markup.button.callback('📈 Chart', 'market_chart')],
    [Markup.button.callback('🛒 Buy', 'market_buy')],
    [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')],
  ]);
  if (section === 'community') return Markup.inlineKeyboard([
    [Markup.button.url('🌐 Website', WEBSITE_URL)],
    [Markup.button.url('🐦 X', X_URL)],
    [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')],
  ]);
  if (section === 'admin') return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Bot Status', 'admin_status')],
    [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')],
  ]);
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')],
  ]);
}

function scheduleAutoClose(chatId, messageId) {
  const key = `${chatId}:${messageId}`;
  if (sessions.has(key)) clearTimeout(sessions.get(key));
  const timer = setTimeout(async () => {
    try { await bot.telegram.deleteMessage(chatId, messageId); } catch (_) {}
    sessions.delete(key);
  }, AUTO_CLOSE_MS);
  sessions.set(key, timer);
}

async function safeDeleteUserCommand(ctx) {
  if (isPrivate(ctx)) return;
  try { await ctx.deleteMessage(); } catch (_) {}
}

async function openPrivatePrompt(ctx) {
  const me = await bot.telegram.getMe();
  const url = `https://t.me/${me.username}?start=menu`;
  const msg = await ctx.reply('🔒 TRINTOPE menu works in private chat.\n\nOpen the bot privately to use Price, Chart, Roadmap, FAQ and official links.',
    Markup.inlineKeyboard([[Markup.button.url('🤖 Open TRINTOPE Bot', url)]]));
  scheduleAutoClose(ctx.chat.id, msg.message_id);
}

async function sendHome(ctx) {
  const msg = await ctx.reply(texts.home(), mainMenu(ctx));
  scheduleAutoClose(ctx.chat.id, msg.message_id);
}

bot.start(async (ctx) => {
  await safeDeleteUserCommand(ctx);
  if (!isPrivate(ctx)) return openPrivatePrompt(ctx);
  return sendHome(ctx);
});

bot.command('help', async (ctx) => {
  await safeDeleteUserCommand(ctx);
  if (!isPrivate(ctx)) return openPrivatePrompt(ctx);
  return sendHome(ctx);
});

bot.command('id', async (ctx) => {
  if (!isPrivate(ctx)) return safeDeleteUserCommand(ctx);
  return ctx.reply(`Your Telegram ID: ${ctx.from.id}`);
});

bot.on('message', async (ctx, next) => {
  const text = ctx.message?.text || '';
  if (!isPrivate(ctx) && text.startsWith('/')) {
    await safeDeleteUserCommand(ctx);
    return openPrivatePrompt(ctx);
  }
  return next();
});

async function edit(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
    const chatId = ctx.callbackQuery.message.chat.id;
    const messageId = ctx.callbackQuery.message.message_id;
    scheduleAutoClose(chatId, messageId);
  } catch (e) {
    // Ignore repeated clicks / unchanged message errors
  }
}

bot.action('home', async (ctx) => {
  await ctx.answerCbQuery();
  return edit(ctx, texts.home(), mainMenu(ctx));
});

bot.action('menu_market', async (ctx) => { await ctx.answerCbQuery(); return edit(ctx, texts.market(), navKeyboard('market', ctx)); });
bot.action('menu_community', async (ctx) => { await ctx.answerCbQuery(); return edit(ctx, texts.community(), navKeyboard('community', ctx)); });
bot.action('menu_project', async (ctx) => { await ctx.answerCbQuery(); return edit(ctx, texts.project(), navKeyboard('project', ctx)); });
bot.action('menu_more', async (ctx) => { await ctx.answerCbQuery(); return edit(ctx, texts.more(), navKeyboard('more', ctx)); });

bot.action('market_price', async (ctx) => { await ctx.answerCbQuery(); return edit(ctx, '💰 Price\n\nToken is not live yet.\n\nPrice tracking will be available after launch.', navKeyboard('back', ctx)); });
bot.action('market_chart', async (ctx) => { await ctx.answerCbQuery(); return edit(ctx, '📈 Chart\n\nChart will be available after launch.', navKeyboard('back', ctx)); });
bot.action('market_buy', async (ctx) => { await ctx.answerCbQuery(); return edit(ctx, '🛒 Buy\n\nTrading is not available yet.\n\nOfficial buy links will appear here after launch.', navKeyboard('back', ctx)); });

bot.action('admin_home', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isPrivate(ctx) || !isAdmin(ctx)) return;
  return edit(ctx, texts.admin(), navKeyboard('admin', ctx));
});

bot.action('admin_status', async (ctx) => {
  await ctx.answerCbQuery();
  if (!isPrivate(ctx) || !isAdmin(ctx)) return;
  return edit(ctx, `📊 Bot Status\n\nStatus: Online\nProject: TRINTOPE\nMode: Private menu + clean group\nAdmin ID: ${ctx.from.id}`, navKeyboard('admin', ctx));
});

bot.action('close', async (ctx) => {
  await ctx.answerCbQuery('Closed');
  try { await ctx.deleteMessage(); } catch (_) {}
});

bot.catch((err) => console.error('Bot error:', err));

bot.launch().then(() => console.log('TRINTOPE bot is running'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
