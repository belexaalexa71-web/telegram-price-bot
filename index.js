const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing. Add it in Railway Variables.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const WEBSITE_URL = 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = 'https://x.com/AndrejK40133234';
const TELEGRAM_GROUP_URL = process.env.TELEGRAM_GROUP_URL || '';
const TELEGRAM_CHANNEL_URL = process.env.TELEGRAM_CHANNEL_URL || '';

const lastBotMessages = new Map();

function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Market', 'market'), Markup.button.callback('🌍 Community', 'community')],
    [Markup.button.callback('📢 News', 'news'), Markup.button.callback('⚙️ More', 'more')],
    [Markup.button.url('🌐 Website', WEBSITE_URL), Markup.button.url('🐦 X', X_URL)]
  ]);
}

function backMenu() {
  return Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back to Home', 'home')]]);
}

function marketMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💰 Price', 'price'), Markup.button.callback('📈 Chart', 'chart')],
    [Markup.button.callback('🛒 Buy', 'buy')],
    [Markup.button.callback('⬅️ Back to Home', 'home')]
  ]);
}

function communityMenu() {
  const rows = [
    [Markup.button.url('🌐 Website', WEBSITE_URL), Markup.button.url('🐦 X', X_URL)]
  ];
  if (TELEGRAM_GROUP_URL) rows.push([Markup.button.url('💬 Telegram Group', TELEGRAM_GROUP_URL)]);
  if (TELEGRAM_CHANNEL_URL) rows.push([Markup.button.url('📢 Telegram Channel', TELEGRAM_CHANNEL_URL)]);
  rows.push([Markup.button.callback('⬅️ Back to Home', 'home')]);
  return Markup.inlineKeyboard(rows);
}

function moreMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💎 Tokenomics', 'tokenomics'), Markup.button.callback('🗺 Roadmap', 'roadmap')],
    [Markup.button.callback('❓ FAQ', 'faq'), Markup.button.callback('📞 Support', 'support')],
    [Markup.button.callback('📜 Whitepaper', 'whitepaper')],
    [Markup.button.callback('⬅️ Back to Home', 'home')]
  ]);
}

const pages = {
  home: {
    text: `🚀 TRINTOPE\n\nOfficial Project Bot\n\n🟢 Status: Building\n\nChoose an option below 👇`,
    keyboard: mainMenu
  },
  market: {
    text: `📊 Market\n\nToken market tools will be available here.\n\nCurrent status: Token is not live yet.`,
    keyboard: marketMenu
  },
  price: {
    text: `💰 Price\n\nToken is not live yet.\n\nPrice tracking will become available after launch.`,
    keyboard: backMenu
  },
  chart: {
    text: `📈 Chart\n\nChart will be available after launch.`,
    keyboard: backMenu
  },
  buy: {
    text: `🛒 Buy TRINTOPE\n\nTrading is not available yet.\n\nThe official buy link will be added after launch.`,
    keyboard: backMenu
  },
  community: {
    text: `🌍 Community\n\nOfficial TRINTOPE links.\n\nAlways use only official links to avoid scams.`,
    keyboard: communityMenu
  },
  news: {
    text: `📢 News\n\nNo announcements yet.\n\nFollow X for the latest project updates.`,
    keyboard: backMenu
  },
  more: {
    text: `⚙️ More\n\nProject information and support.`,
    keyboard: moreMenu
  },
  tokenomics: {
    text: `💎 Tokenomics\n\nComing soon.\n\nTokenomics will be published before launch.`,
    keyboard: backMenu
  },
  roadmap: {
    text: `🗺 Roadmap\n\n✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n⬜ CEX Listing`,
    keyboard: backMenu
  },
  faq: {
    text: `❓ FAQ\n\nWhat is TRINTOPE?\nA community-driven Web3 project.\n\nWhen will the token launch?\nThe launch date will be announced soon.\n\nWhere can I buy it?\nThe official buy link will be available after launch.`,
    keyboard: backMenu
  },
  support: {
    text: `📞 Support\n\nNeed help?\n\nContact us through the official X account.`,
    keyboard: backMenu
  },
  whitepaper: {
    text: `📜 Whitepaper\n\nComing soon.\n\nThe official document will be added here when it is ready.`,
    keyboard: backMenu
  }
};

async function deleteUserCommand(ctx) {
  try {
    if (ctx.chat && ctx.message) {
      await ctx.deleteMessage(ctx.message.message_id);
    }
  } catch (e) {
    // Bot needs admin permission to delete messages in groups.
  }
}

async function sendCleanHome(ctx) {
  const chatId = ctx.chat.id;
  const oldId = lastBotMessages.get(chatId);
  if (oldId) {
    try { await ctx.telegram.deleteMessage(chatId, oldId); } catch (e) {}
  }
  const sent = await ctx.reply(pages.home.text, pages.home.keyboard());
  lastBotMessages.set(chatId, sent.message_id);
}

bot.start(async (ctx) => {
  await deleteUserCommand(ctx);
  await sendCleanHome(ctx);
});

bot.help(async (ctx) => {
  await deleteUserCommand(ctx);
  const text = `❓ Help\n\nUse /start to open the TRINTOPE menu.\n\nAll main sections are available through buttons, so the chat stays clean.`;
  const sent = await ctx.reply(text, backMenu());
  lastBotMessages.set(ctx.chat.id, sent.message_id);
});

bot.command(['price', 'chart', 'buy', 'links'], async (ctx) => {
  await deleteUserCommand(ctx);
  await sendCleanHome(ctx);
});

bot.action(Object.keys(pages), async (ctx) => {
  const key = ctx.match[0];
  const page = pages[key];
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageText(page.text, page.keyboard());
  } catch (e) {
    try {
      const sent = await ctx.reply(page.text, page.keyboard());
      lastBotMessages.set(ctx.chat.id, sent.message_id);
    } catch (err) {
      console.error(err);
    }
  }
});

bot.catch((err) => console.error('Bot error:', err));

bot.launch();
console.log('TRINTOPE bot is running.');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
