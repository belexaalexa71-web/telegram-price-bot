const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing. Add it in Railway Variables.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const PROJECT_NAME = process.env.PROJECT_NAME || 'TRINTOPE';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = process.env.X_URL || 'https://x.com/AndrejK40133234';
const TELEGRAM_URL = process.env.TELEGRAM_URL || '';
const CHART_URL = process.env.CHART_URL || '';
const BUY_URL = process.env.BUY_URL || '';
const ADMIN_ID = process.env.ADMIN_ID || '';
const MENU_TTL_MS = Number(process.env.MENU_TTL_MS || 120000); // default: 2 minutes

// One active menu per chat.
// chatId -> { messageId, timer }
const sessions = new Map();

function isAdmin(ctx) {
  return Boolean(ADMIN_ID && ctx.from && String(ctx.from.id) === String(ADMIN_ID));
}

function clearTimer(key) {
  const session = sessions.get(key);
  if (session?.timer) clearTimeout(session.timer);
}

function resetAutoDelete(ctx, chatId, messageId) {
  const key = String(chatId);
  clearTimer(key);

  const timer = setTimeout(async () => {
    try {
      await ctx.telegram.deleteMessage(chatId, messageId);
    } catch (_) {}
    sessions.delete(key);
  }, MENU_TTL_MS);

  sessions.set(key, { messageId, timer });
}

async function deleteMessageSafe(ctx, chatId, messageId) {
  try { await ctx.telegram.deleteMessage(chatId, messageId); } catch (_) {}
}

async function deleteUserCommand(ctx) {
  if (!ctx.message) return;
  try { await ctx.deleteMessage(ctx.message.message_id); } catch (_) {}
}

async function closeMenu(ctx) {
  const chatId = ctx.chat.id;
  const key = String(chatId);
  const session = sessions.get(key);
  if (ctx.callbackQuery) {
    try { await ctx.answerCbQuery('Closed'); } catch (_) {}
    await deleteMessageSafe(ctx, chatId, ctx.callbackQuery.message.message_id);
  } else if (session?.messageId) {
    await deleteMessageSafe(ctx, chatId, session.messageId);
  }
  clearTimer(key);
  sessions.delete(key);
}

const closeBtn = Markup.button.callback('✖️ Close', 'close');
const backBtn = Markup.button.callback('⬅️ Back', 'home');

function homeText(ctx) {
  const admin = isAdmin(ctx) ? '\n\n🔒 Admin mode available.' : '';
  return `🚀 ${PROJECT_NAME}\n\nOfficial Project Bot\n\n🟢 Status: Building\n\nUse the menu below to navigate.${admin}`;
}

function homeKeyboard(ctx) {
  const rows = [
    [Markup.button.callback('💰 Market', 'market'), Markup.button.callback('🌍 Community', 'community')],
    [Markup.button.callback('📚 Project', 'project'), Markup.button.callback('⚙️ More', 'more')]
  ];
  if (isAdmin(ctx)) rows.push([Markup.button.callback('🔒 Admin Panel', 'admin')]);
  rows.push([closeBtn]);
  return Markup.inlineKeyboard(rows);
}

function marketKeyboard() {
  const rows = [
    [Markup.button.callback('💰 Price', 'price'), Markup.button.callback('📈 Chart', 'chart')],
    [Markup.button.callback('🛒 Buy', 'buy')]
  ];
  if (CHART_URL) rows.push([Markup.button.url('Open Chart', CHART_URL)]);
  if (BUY_URL) rows.push([Markup.button.url('Buy Token', BUY_URL)]);
  rows.push([backBtn, closeBtn]);
  return Markup.inlineKeyboard(rows);
}

function communityKeyboard() {
  const rows = [[Markup.button.url('🌐 Website', WEBSITE_URL), Markup.button.url('🐦 X', X_URL)]];
  if (TELEGRAM_URL) rows.push([Markup.button.url('💬 Telegram', TELEGRAM_URL)]);
  rows.push([backBtn, closeBtn]);
  return Markup.inlineKeyboard(rows);
}

function projectKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📢 News', 'news'), Markup.button.callback('🗺 Roadmap', 'roadmap')],
    [Markup.button.callback('💎 Tokenomics', 'tokenomics'), Markup.button.callback('📜 Whitepaper', 'whitepaper')],
    [backBtn, closeBtn]
  ]);
}

function moreKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('❓ FAQ', 'faq'), Markup.button.callback('📞 Support', 'support')],
    [Markup.button.callback('✅ Official Links', 'official_links')],
    [backBtn, closeBtn]
  ]);
}

function adminKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📢 News Settings', 'admin_news')],
    [Markup.button.callback('🟢 Status Settings', 'admin_status')],
    [backBtn, closeBtn]
  ]);
}

async function show(ctx, text, keyboard) {
  const chatId = ctx.chat.id;
  const key = String(chatId);
  const session = sessions.get(key);

  if (ctx.callbackQuery) {
    try { await ctx.answerCbQuery(); } catch (_) {}
    try {
      await ctx.editMessageText(text, { ...keyboard, disable_web_page_preview: true });
      resetAutoDelete(ctx, chatId, ctx.callbackQuery.message.message_id);
      return;
    } catch (_) {}
  }

  if (session?.messageId) {
    await deleteMessageSafe(ctx, chatId, session.messageId);
    clearTimer(key);
    sessions.delete(key);
  }

  const sent = await ctx.reply(text, { ...keyboard, disable_web_page_preview: true });
  resetAutoDelete(ctx, chatId, sent.message_id);
}

bot.start(async (ctx) => {
  await deleteUserCommand(ctx);
  await show(ctx, homeText(ctx), homeKeyboard(ctx));
});

bot.help(async (ctx) => {
  await deleteUserCommand(ctx);
  await show(ctx, `❓ Help\n\nUse /start to open the ${PROJECT_NAME} menu.\n\nThe bot keeps the chat clean by editing one message and deleting it after inactivity.`, homeKeyboard(ctx));
});

bot.command(['price', 'chart', 'buy', 'links'], async (ctx) => {
  await deleteUserCommand(ctx);
  await show(ctx, homeText(ctx), homeKeyboard(ctx));
});

bot.action('close', closeMenu);
bot.action('home', (ctx) => show(ctx, homeText(ctx), homeKeyboard(ctx)));

bot.action('market', (ctx) => show(ctx, '💰 Market\n\nToken market tools are prepared for launch.\n\nPrice, chart and buy links can be activated later.', marketKeyboard()));
bot.action('price', (ctx) => show(ctx, '💰 Price\n\nToken is not live yet.\n\nPrice tracking will become available after launch.', marketKeyboard()));
bot.action('chart', (ctx) => show(ctx, CHART_URL ? '📈 Chart\n\nOpen the official chart below.' : '📈 Chart\n\nChart will be available after launch.', marketKeyboard()));
bot.action('buy', (ctx) => show(ctx, BUY_URL ? '🛒 Buy\n\nUse only the official buy link below.' : '🛒 Buy\n\nTrading is not available yet.\n\nOfficial buy links will be added after launch.', marketKeyboard()));

bot.action('community', (ctx) => show(ctx, `🌍 Community\n\nUse only official ${PROJECT_NAME} links.`, communityKeyboard()));

bot.action('project', (ctx) => show(ctx, '📚 Project\n\nProject information, roadmap, tokenomics and announcements.', projectKeyboard()));
bot.action('news', (ctx) => show(ctx, '📢 News\n\nNo announcements yet.\n\nFollow X for the latest updates.', projectKeyboard()));
bot.action('roadmap', (ctx) => show(ctx, '🗺 Roadmap\n\n✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n⬜ CEX Listing', projectKeyboard()));
bot.action('tokenomics', (ctx) => show(ctx, '💎 Tokenomics\n\nComing soon.\n\nTokenomics will be published before launch.', projectKeyboard()));
bot.action('whitepaper', (ctx) => show(ctx, '📜 Whitepaper\n\nComing soon.\n\nThe official whitepaper will be added later.', projectKeyboard()));

bot.action('more', (ctx) => show(ctx, '⚙️ More\n\nFAQ, support and verified project links.', moreKeyboard()));
bot.action('faq', (ctx) => show(ctx, `❓ FAQ\n\nWhat is ${PROJECT_NAME}?\nA community-driven Web3 project.\n\nWhen will the token launch?\nThe launch date will be announced soon.\n\nWhere can I buy it?\nThe official buy link will be available after launch.`, moreKeyboard()));
bot.action('support', (ctx) => show(ctx, '📞 Support\n\nNeed help?\n\nContact us through the official X account.', moreKeyboard()));
bot.action('official_links', (ctx) => show(ctx, `✅ Official Links\n\n🌐 Website:\n${WEBSITE_URL}\n\n🐦 X:\n${X_URL}\n\nAlways use only official links.`, moreKeyboard()));

bot.action('admin', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Admin only', { show_alert: true });
  return show(ctx, '🔒 Admin Panel\n\nAdmin tools are prepared for future updates.\n\nNext step: connect editable settings and news.', adminKeyboard());
});
bot.action('admin_news', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Admin only', { show_alert: true });
  return show(ctx, '📢 News Settings\n\nComing soon: publish announcements directly from Telegram.', adminKeyboard());
});
bot.action('admin_status', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Admin only', { show_alert: true });
  return show(ctx, '🟢 Status Settings\n\nComing soon: switch status between Building, Presale and Live.', adminKeyboard());
});

bot.catch((err) => console.error('Bot error:', err));

bot.launch().then(() => console.log(`${PROJECT_NAME} bot v6 is running`));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
