import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_SETUP_CODE = process.env.OWNER_SETUP_CODE || '';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/';
const X_URL = process.env.X_URL || 'https://x.com/AndrejK40133234';
const MENU_TTL_MS = Number(process.env.MENU_TTL_MS || 300000);

if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// In-memory storage for v1. Next step can replace this with DB.
const state = {
  ownerIds: new Set((process.env.ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean)),
  users: new Map(),
  menuMessages: new Map(),
  cleanupTimers: new Map(),
  settings: {
    version: '1.1.0',
    status: 'Development',
    website: WEBSITE_URL,
    x: X_URL,
    news: 'No announcements yet.',
    roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
    tokenomics: 'Coming soon. Tokenomics will be published before launch.',
    faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen launch?\nThe date will be announced soon.',
    welcome: 'Official Project Assistant'
  },
  pendingEdit: new Map(),
  actionLog: []
};

const isPrivate = (ctx) => ctx.chat?.type === 'private';
const userId = (ctx) => String(ctx.from?.id || '');
const isOwner = (ctx) => state.ownerIds.has(userId(ctx));

function logAction(ctx, action) {
  const line = `${new Date().toISOString()} | ${ctx.from?.id} | ${action}`;
  state.actionLog.unshift(line);
  state.actionLog = state.actionLog.slice(0, 20);
}

async function safeDelete(ctx, chatId, messageId) {
  try { await ctx.telegram.deleteMessage(chatId, messageId); } catch (_) {}
}

async function deleteIncomingCommand(ctx) {
  if (ctx.message?.message_id) await safeDelete(ctx, ctx.chat.id, ctx.message.message_id);
}

function resetTimer(ctx, chatId, messageId) {
  const key = `${chatId}:${messageId}`;
  if (state.cleanupTimers.has(key)) clearTimeout(state.cleanupTimers.get(key));
  state.cleanupTimers.set(key, setTimeout(async () => {
    try { await ctx.telegram.deleteMessage(chatId, messageId); } catch (_) {}
    state.cleanupTimers.delete(key);
    state.menuMessages.delete(String(chatId));
  }, MENU_TTL_MS));
}

function baseButtons(includeAdmin) {
  const rows = [
    [Markup.button.callback('📊 Market', 'market'), Markup.button.callback('🌍 Community', 'community')],
    [Markup.button.callback('📚 Project', 'project'), Markup.button.callback('❓ Help', 'help')]
  ];
  if (includeAdmin) rows.push([Markup.button.callback('🔒 Control Center', 'admin')]);
  rows.push([Markup.button.callback('❌ Close', 'close')]);
  return Markup.inlineKeyboard(rows);
}

function navButtons(back = 'home') {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back', back), Markup.button.callback('🏠 Home', 'home')],
    [Markup.button.callback('❌ Close', 'close')]
  ]);
}

function homeText(ctx) {
  return `🔷 TRINTOPE\n\n${state.settings.welcome}\n\n🟢 Status: ${state.settings.status}\nVersion: ${state.settings.version}\n\nChoose an option below.`;
}

function adminText() {
  const log = state.actionLog.slice(0, 3).map(x => `• ${x}`).join('\n') || 'No recent actions.';
  return `🔒 TRINTOPE Control Center\n\nWelcome back, Owner.\n\nManage your project from Telegram.\n\nStatus: 🟢 ${state.settings.status}\nVersion: ${state.settings.version}\n\nRecent actions:\n${log}`;
}

function adminKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📢 Content', 'admin_content'), Markup.button.callback('🌐 Project', 'admin_project')],
    [Markup.button.callback('📊 Analytics', 'admin_stats'), Markup.button.callback('⚙️ System', 'admin_system')],
    [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]
  ]);
}

function editKeyboard(section) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Edit', `edit:${section}`)],
    [Markup.button.callback('⬅️ Back', 'admin'), Markup.button.callback('❌ Close', 'close')]
  ]);
}

async function showMenu(ctx, text, keyboard) {
  const chatId = ctx.chat?.id;
  const chatKey = String(chatId);
  const currentId = state.menuMessages.get(chatKey);
  if (currentId) {
    try {
      await ctx.telegram.editMessageText(chatId, currentId, undefined, text, { reply_markup: keyboard.reply_markup, disable_web_page_preview: true });
      resetTimer(ctx, chatId, currentId);
      return;
    } catch (_) {}
  }
  const sent = await ctx.reply(text, { reply_markup: keyboard.reply_markup, disable_web_page_preview: true });
  state.menuMessages.set(chatKey, sent.message_id);
  resetTimer(ctx, chatId, sent.message_id);
}

async function groupCommand(ctx) {
  await deleteIncomingCommand(ctx);
  const me = await ctx.telegram.getMe();
  const url = `https://t.me/${me.username}`;
  const sent = await ctx.reply('🔒 Open the official TRINTOPE Bot in private chat.', Markup.inlineKeyboard([
    [Markup.button.url('Open TRINTOPE Bot', url)]
  ]));
  setTimeout(() => safeDelete(ctx, ctx.chat.id, sent.message_id), 12000);
}

bot.start(async (ctx) => {
  state.users.set(userId(ctx), { id: userId(ctx), username: ctx.from?.username, firstName: ctx.from?.first_name, lastSeen: Date.now() });
  if (!isPrivate(ctx)) return groupCommand(ctx);
  await deleteIncomingCommand(ctx);
  await showMenu(ctx, homeText(ctx), baseButtons(isOwner(ctx)));
});

bot.command('help', async (ctx) => {
  if (!isPrivate(ctx)) return groupCommand(ctx);
  await deleteIncomingCommand(ctx);
  await showMenu(ctx, '❓ Help\n\nUse the buttons to navigate.\nAll official links and project information are available inside the bot.', navButtons('home'));
});

bot.command('id', async (ctx) => {
  if (!isPrivate(ctx)) return groupCommand(ctx);
  await deleteIncomingCommand(ctx);
  const sent = await ctx.reply(`Your Telegram ID:\n${ctx.from.id}`);
  setTimeout(() => safeDelete(ctx, ctx.chat.id, sent.message_id), 15000);
});

bot.command('setup_owner', async (ctx) => {
  if (!isPrivate(ctx)) return groupCommand(ctx);
  await deleteIncomingCommand(ctx);
  const code = (ctx.message?.text || '').split(' ').slice(1).join(' ').trim();
  if (!OWNER_SETUP_CODE) {
    const sent = await ctx.reply('❌ OWNER_SETUP_CODE is not configured.');
    setTimeout(() => safeDelete(ctx, ctx.chat.id, sent.message_id), 12000);
    return;
  }
  if (state.ownerIds.size > 0 && !isOwner(ctx)) {
    const sent = await ctx.reply('🔒 Owner is already configured.');
    setTimeout(() => safeDelete(ctx, ctx.chat.id, sent.message_id), 12000);
    return;
  }
  if (code !== OWNER_SETUP_CODE) {
    const sent = await ctx.reply('❌ Invalid setup code.');
    setTimeout(() => safeDelete(ctx, ctx.chat.id, sent.message_id), 12000);
    return;
  }
  state.ownerIds.add(userId(ctx));
  logAction(ctx, 'Owner access activated');
  const sent = await ctx.reply('✅ Owner access activated. Admin Panel is now available to you.');
  setTimeout(() => safeDelete(ctx, ctx.chat.id, sent.message_id), 12000);
});

bot.on('text', async (ctx) => {
  if (!isPrivate(ctx)) {
    if ((ctx.message.text || '').startsWith('/')) return groupCommand(ctx);
    return;
  }
  const uid = userId(ctx);
  const pending = state.pendingEdit.get(uid);
  if (!pending) return;
  await deleteIncomingCommand(ctx);
  const value = ctx.message.text.trim();
  state.settings[pending] = value;
  state.pendingEdit.delete(uid);
  logAction(ctx, `Updated ${pending}`);
  await showMenu(ctx, `✅ Updated: ${pending}\n\n${value}`, navButtons('admin'));
});

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery().catch(() => {});
  if (!isPrivate(ctx)) return;
  const uid = userId(ctx);

  if (data === 'close') {
    const msgId = ctx.callbackQuery.message?.message_id;
    if (msgId) await safeDelete(ctx, ctx.chat.id, msgId);
    state.menuMessages.delete(String(ctx.chat.id));
    return;
  }
  if (data === 'home') return showMenu(ctx, homeText(ctx), baseButtons(isOwner(ctx)));

  if (data === 'market') return showMenu(ctx, '📊 Market\n\n💰 Price: Token is not live yet.\n📈 Chart: Available after launch.\n🛒 Buy: Trading is not available yet.', navButtons('home'));
  if (data === 'community') return showMenu(ctx, `🌍 Community\n\n🌐 Website:\n${state.settings.website}\n\n🐦 X:\n${state.settings.x}`, Markup.inlineKeyboard([
    [Markup.button.url('🌐 Website', state.settings.website), Markup.button.url('🐦 X', state.settings.x)],
    [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]
  ]));
  if (data === 'project') return showMenu(ctx, `📚 Project\n\n📢 News:\n${state.settings.news}\n\n🗺 Roadmap:\n${state.settings.roadmap}`, navButtons('home'));
  if (data === 'help') return showMenu(ctx, '❓ Help\n\nThis is the official TRINTOPE assistant. Use it to access official links, project info, and future token data.', navButtons('home'));

  if (data === 'admin') {
    if (!isOwner(ctx)) return;
    return showMenu(ctx, adminText(), adminKeyboard());
  }
  if (!isOwner(ctx)) return;

  if (data === 'admin_content') return showMenu(ctx, `📢 Content\n\nNews:\n${state.settings.news}\n\nWelcome:\n${state.settings.welcome}`, Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Edit News', 'edit:news'), Markup.button.callback('✏️ Edit Welcome', 'edit:welcome')],
    [Markup.button.callback('✏️ Edit FAQ', 'edit:faq')],
    [Markup.button.callback('⬅️ Back', 'admin'), Markup.button.callback('❌ Close', 'close')]
  ]));
  if (data === 'admin_project') return showMenu(ctx, `🌐 Project\n\nWebsite:\n${state.settings.website}\n\nX:\n${state.settings.x}\n\nRoadmap:\n${state.settings.roadmap}\n\nTokenomics:\n${state.settings.tokenomics}`, Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Website', 'edit:website'), Markup.button.callback('✏️ X', 'edit:x')],
    [Markup.button.callback('✏️ Roadmap', 'edit:roadmap'), Markup.button.callback('✏️ Tokenomics', 'edit:tokenomics')],
    [Markup.button.callback('⬅️ Back', 'admin'), Markup.button.callback('❌ Close', 'close')]
  ]));
  if (data === 'admin_stats') return showMenu(ctx, `📊 Analytics\n\nUsers tracked: ${state.users.size}\nOwners: ${state.ownerIds.size}\nRecent actions: ${state.actionLog.length}`, navButtons('admin'));
  if (data === 'admin_system') return showMenu(ctx, `⚙️ System\n\nStatus: ${state.settings.status}\nVersion: ${state.settings.version}`, Markup.inlineKeyboard([
    [Markup.button.callback('🟢 Development', 'status:Development'), Markup.button.callback('🟡 Presale', 'status:Presale')],
    [Markup.button.callback('🚀 Live', 'status:Live')],
    [Markup.button.callback('⬅️ Back', 'admin'), Markup.button.callback('❌ Close', 'close')]
  ]));

  if (data.startsWith('status:')) {
    const status = data.split(':')[1];
    state.settings.status = status;
    logAction(ctx, `Changed status to ${status}`);
    return showMenu(ctx, `✅ Status updated\n\nCurrent status: ${status}`, navButtons('admin'));
  }

  if (data.startsWith('edit:')) {
    const section = data.split(':')[1];
    state.pendingEdit.set(uid, section);
    return showMenu(ctx, `✏️ Edit ${section}\n\nSend the new value as your next message.\n\nIt will replace the current value.`, navButtons('admin'));
  }
});

bot.catch((err) => console.error('Bot error:', err));

bot.launch().then(() => console.log('TRINTOPE Bot started'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
