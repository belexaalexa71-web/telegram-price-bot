import TelegramBot from 'node-telegram-bot-api';

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);

if (!TOKEN) throw new Error('BOT_TOKEN is missing');

const bot = new TelegramBot(TOKEN, { polling: true });

const SITE = 'https://ea32b09e.trintope-universe.pages.dev/';
const X_LINK = 'https://x.com/AndrejK40133234';

const userIds = new Set();
let projectStatus = 'Building';
let lastNews = 'No announcements yet.';

const sessions = new Map();

function isAdmin(userId) {
  return ADMIN_IDS.includes(String(userId));
}

function isPrivate(msgOrQuery) {
  const chat = msgOrQuery.message?.chat || msgOrQuery.chat;
  return chat?.type === 'private';
}

function keyboard(rows) {
  return { inline_keyboard: rows };
}

function homeKeyboard(userId) {
  const rows = [
    [
      { text: '📊 Market', callback_data: 'market' },
      { text: '📚 Project', callback_data: 'project' }
    ],
    [
      { text: '🌍 Community', callback_data: 'community' },
      { text: '⚙️ More', callback_data: 'more' }
    ]
  ];
  if (isAdmin(userId)) rows.push([{ text: '🔒 Admin Panel', callback_data: 'admin' }]);
  rows.push([{ text: '❌ Close', callback_data: 'close' }]);
  return keyboard(rows);
}

function screen(name, userId) {
  const back = [{ text: '⬅️ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }];
  const screens = {
    home: {
      text: `🚀 TRINTOPE\n\nOfficial Project Bot\n\n🟢 Status: ${projectStatus}\n\nChoose an option below.`,
      reply_markup: homeKeyboard(userId)
    },
    market: {
      text: `📊 Market\n\n💰 Price: Token is not live yet.\n📈 Chart: Available after launch.\n🛒 Buy: Trading is not available yet.`,
      reply_markup: keyboard([back])
    },
    project: {
      text: `📚 Project\n\n📢 News:\n${lastNews}\n\n🗺 Roadmap:\n✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n\n💎 Tokenomics: Coming soon.`,
      reply_markup: keyboard([back])
    },
    community: {
      text: `🌍 Community\n\nUse only official TRINTOPE links.`,
      reply_markup: keyboard([
        [{ text: '🌐 Website', url: SITE }],
        [{ text: '🐦 X', url: X_LINK }],
        back
      ])
    },
    more: {
      text: `⚙️ More\n\n❓ FAQ\nTRINTOPE is a community-driven Web3 project.\n\n📞 Support\nContact us through official X.`,
      reply_markup: keyboard([back])
    },
    admin: {
      text: `🔒 Admin Panel\n\nOnly authorized admin IDs can see this panel.\n\nUsers: ${userIds.size}\nStatus: ${projectStatus}`,
      reply_markup: keyboard([
        [{ text: '📊 Stats', callback_data: 'admin_stats' }, { text: '🟢 Status', callback_data: 'admin_status' }],
        [{ text: '📢 News', callback_data: 'admin_news' }, { text: '🔗 Links', callback_data: 'admin_links' }],
        back
      ])
    },
    admin_stats: {
      text: `📊 Bot Statistics\n\nUsers who opened bot: ${userIds.size}\nProject status: ${projectStatus}\n\nMore analytics can be added later.`,
      reply_markup: keyboard([[{ text: '⬅️ Admin', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]])
    },
    admin_status: {
      text: `🟢 Change Project Status\n\nCurrent: ${projectStatus}\n\nChoose new status:`,
      reply_markup: keyboard([
        [{ text: '🟢 Building', callback_data: 'set_status:Building' }],
        [{ text: '🟡 Presale', callback_data: 'set_status:Presale' }],
        [{ text: '🚀 Live', callback_data: 'set_status:Live' }],
        [{ text: '⬅️ Admin', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]
      ])
    },
    admin_news: {
      text: `📢 News\n\nCurrent news:\n${lastNews}\n\nEditing news directly from Telegram will be added in the next version.`,
      reply_markup: keyboard([[{ text: '⬅️ Admin', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]])
    },
    admin_links: {
      text: `🔗 Official Links\n\nWebsite:\n${SITE}\n\nX:\n${X_LINK}`,
      reply_markup: keyboard([[{ text: '⬅️ Admin', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]])
    }
  };
  return screens[name] || screens.home;
}

async function deleteLater(chatId, messageId, ms = 12000) {
  setTimeout(() => bot.deleteMessage(chatId, messageId).catch(() => {}), ms);
}

async function showPrivateMenu(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  userIds.add(userId);

  const previous = sessions.get(userId);
  if (previous) await bot.deleteMessage(chatId, previous).catch(() => {});

  const sent = await bot.sendMessage(chatId, screen('home', userId).text, screen('home', userId));
  sessions.set(userId, sent.message_id);
}

bot.onText(/\/id/, async (msg) => {
  if (msg.chat.type !== 'private') return;
  await bot.sendMessage(msg.chat.id, `Your Telegram ID: ${msg.from.id}`);
});

bot.onText(/\/start|\/help/, async (msg) => {
  userIds.add(msg.from.id);

  if (msg.chat.type !== 'private') {
    await bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
    const me = await bot.getMe();
    const sent = await bot.sendMessage(msg.chat.id, '🔒 Open the official TRINTOPE Bot in private chat.', {
      reply_markup: keyboard([[{ text: '🤖 Open Bot', url: `https://t.me/${me.username}` }]])
    });
    deleteLater(msg.chat.id, sent.message_id, 10000);
    return;
  }

  await showPrivateMenu(msg);
});

bot.on('callback_query', async (q) => {
  const userId = q.from.id;
  userIds.add(userId);

  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;
  const data = q.data;

  await bot.answerCallbackQuery(q.id).catch(() => {});

  if (data === 'close') {
    await bot.deleteMessage(chatId, messageId).catch(() => {});
    sessions.delete(userId);
    return;
  }

  if (data.startsWith('admin') || data.startsWith('set_status')) {
    if (!isAdmin(userId) || q.message.chat.type !== 'private') {
      await bot.answerCallbackQuery(q.id, { text: 'Access denied', show_alert: true }).catch(() => {});
      return;
    }
  }

  if (data.startsWith('set_status:')) {
    projectStatus = data.split(':')[1];
    await bot.editMessageText(`✅ Status updated to: ${projectStatus}`, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard([[{ text: '⬅️ Admin', callback_data: 'admin' }, { text: '🏠 Home', callback_data: 'home' }]])
    }).catch(() => {});
    return;
  }

  const s = screen(data, userId);
  await bot.editMessageText(s.text, {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: s.reply_markup
  }).catch(() => {});
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  if (msg.chat.type !== 'private') return;
});

console.log('TRINTOPE Bot Admin Core v2 is running');
