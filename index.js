const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID || '';
if (!BOT_TOKEN) throw new Error('BOT_TOKEN is required');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const DATA_FILE = path.join(__dirname, 'data.json');

const defaults = {
  project: 'TRINTOPE',
  status: 'Building',
  website: 'https://ea32b09e.trintope-universe.pages.dev/',
  x: 'https://x.com/AndrejK40133234',
  chain: 'Coming soon',
  contract: 'Coming soon',
  chart: '',
  buy: '',
  news: 'No announcements yet.',
  tokenomics: 'Coming soon.',
  roadmap: '✅ Website\n✅ Telegram Bot\n✅ X\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing\n⬜ CEX Listing',
  faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen launch?\nThe launch date will be announced soon.\n\nWhere can I buy?\nThe buy link will be available after launch.',
  support: 'Need help? Contact us via X.'
};

function loadData() {
  try { return { ...defaults, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; }
  catch { return { ...defaults }; }
}
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
let data = loadData();

function isOwner(msgOrQuery) {
  const id = String(msgOrQuery.from?.id || '');
  return OWNER_ID && id === String(OWNER_ID);
}
function mainMenu() {
  return { inline_keyboard: [
    [{ text: '💰 Price', callback_data: 'price' }, { text: '📈 Chart', callback_data: 'chart' }],
    [{ text: '🛒 Buy', callback_data: 'buy' }, { text: '📢 News', callback_data: 'news' }],
    [{ text: '🌐 Website', url: data.website }, { text: '🐦 X', url: data.x }],
    [{ text: '💎 Tokenomics', callback_data: 'tokenomics' }, { text: '🗺 Roadmap', callback_data: 'roadmap' }],
    [{ text: '👥 Community', callback_data: 'community' }, { text: '❓ FAQ', callback_data: 'faq' }],
    [{ text: '📞 Support', callback_data: 'support' }]
  ]};
}
function adminMenu() {
  return { inline_keyboard: [
    [{ text: '🟢 Status', callback_data: 'admin_status' }, { text: '📜 Contract', callback_data: 'admin_contract' }],
    [{ text: '⛓ Chain', callback_data: 'admin_chain' }, { text: '🛒 Buy Link', callback_data: 'admin_buy' }],
    [{ text: '📈 Chart Link', callback_data: 'admin_chart' }, { text: '📢 News', callback_data: 'admin_news' }],
    [{ text: '🌐 Website', callback_data: 'admin_website' }, { text: '🐦 X', callback_data: 'admin_x' }],
    [{ text: '📊 Current Settings', callback_data: 'admin_settings' }]
  ]};
}
function homeText() {
  return `🚀 ${data.project}\n\nOfficial Project Bot\n\n🟢 Status: ${data.status}\n\nChoose an option below 👇`;
}
async function safeDelete(chatId, messageId) { try { await bot.deleteMessage(chatId, messageId); } catch (_) {} }
async function sendPrivateMenu(userId) { return bot.sendMessage(userId, homeText(), { reply_markup: mainMenu(), disable_web_page_preview: true }); }

bot.onText(/\/start|\/help|\/price|\/chart|\/buy|\/links|\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text || '';
  if (msg.chat.type !== 'private') {
    await safeDelete(chatId, msg.message_id);
    try { await sendPrivateMenu(userId); }
    catch {
      const sent = await bot.sendMessage(chatId, 'Open TRINTOPE Bot:', {
        reply_markup: { inline_keyboard: [[{ text: '🚀 Open TRINTOPE Bot', url: `https://t.me/${(await bot.getMe()).username}` }]] },
        disable_notification: true
      });
      setTimeout(() => safeDelete(chatId, sent.message_id), 8000);
    }
    return;
  }
  if (text.startsWith('/admin')) {
    if (!isOwner(msg)) return bot.sendMessage(chatId, 'Admin access denied.');
    return bot.sendMessage(chatId, '⚙️ TRINTOPE Admin Panel\n\nChoose what you want to update:', { reply_markup: adminMenu() });
  }
  if (text.startsWith('/price')) return bot.sendMessage(chatId, priceText(), { reply_markup: mainMenu() });
  if (text.startsWith('/chart')) return bot.sendMessage(chatId, chartText(), { reply_markup: mainMenu() });
  if (text.startsWith('/buy')) return bot.sendMessage(chatId, buyText(), { reply_markup: mainMenu() });
  return sendPrivateMenu(chatId);
});

function priceText(){ return data.contract === 'Coming soon' ? '💰 Token is not live yet.\n\nPrice tracking will become available after launch.' : `💰 Price\n\nChain: ${data.chain}\nContract: ${data.contract}\n\nAutomatic price tracking will be connected next.`; }
function chartText(){ return data.chart ? `📈 Chart:\n${data.chart}` : '📈 Chart will be available after launch.'; }
function buyText(){ return data.buy ? `🛒 Buy TRINTOPE:\n${data.buy}` : '🛒 Trading is not available yet.\n\nStay tuned.'; }
function linksText(){ return `🔗 Official Links\n\n🌐 Website: ${data.website}\n🐦 X: ${data.x}\n⛓ Chain: ${data.chain}\n📜 Contract: ${data.contract}`; }

bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;
  if (q.message.chat.type !== 'private') { await safeDelete(chatId, messageId); return bot.answerCallbackQuery(q.id); }
  const c = q.data;
  const map = {
    price: priceText(), chart: chartText(), buy: buyText(), news: `📢 News\n\n${data.news}`,
    tokenomics: `💎 Tokenomics\n\n${data.tokenomics}`, roadmap: `🗺 Roadmap\n\n${data.roadmap}`,
    community: linksText(), faq: `❓ FAQ\n\n${data.faq}`, support: `📞 Support\n\n${data.support}`
  };
  if (map[c]) {
    await bot.editMessageText(map[c], { chat_id: chatId, message_id: messageId, reply_markup: mainMenu(), disable_web_page_preview: true }).catch(()=>{});
    return bot.answerCallbackQuery(q.id);
  }
  if (c.startsWith('admin_')) {
    if (!isOwner(q)) return bot.answerCallbackQuery(q.id, { text: 'Access denied', show_alert: true });
    const key = c.replace('admin_', '');
    if (key === 'settings') {
      return bot.editMessageText(`⚙️ Current Settings\n\nStatus: ${data.status}\nChain: ${data.chain}\nContract: ${data.contract}\nBuy: ${data.buy || 'not set'}\nChart: ${data.chart || 'not set'}\nWebsite: ${data.website}\nX: ${data.x}`, { chat_id: chatId, message_id: messageId, reply_markup: adminMenu(), disable_web_page_preview: true });
    }
    const commands = { status:'/setstatus LIVE', contract:'/setcontract CONTRACT_ADDRESS', chain:'/setchain BSC', buy:'/setbuy https://...', chart:'/setchart https://...', news:'/setnews Your announcement', website:'/setwebsite https://...', x:'/setx https://x.com/...' };
    await bot.sendMessage(chatId, `Send command:\n\n${commands[key] || '/admin'}`);
    return bot.answerCallbackQuery(q.id);
  }
});

const setters = {
  setstatus:'status', setcontract:'contract', setchain:'chain', setbuy:'buy', setchart:'chart', setnews:'news', setwebsite:'website', setx:'x', settokenomics:'tokenomics', setroadmap:'roadmap', setfaq:'faq', setsupport:'support'
};
bot.on('message', async (msg) => {
  if (!msg.text || !msg.text.startsWith('/')) return;
  const [cmdRaw, ...rest] = msg.text.split(' ');
  const cmd = cmdRaw.slice(1).split('@')[0].toLowerCase();
  if (!setters[cmd]) return;
  if (msg.chat.type !== 'private') { await safeDelete(msg.chat.id, msg.message_id); return; }
  if (!isOwner(msg)) return bot.sendMessage(msg.chat.id, 'Admin access denied.');
  const value = rest.join(' ').trim();
  if (!value) return bot.sendMessage(msg.chat.id, `Usage: /${cmd} value`);
  data[setters[cmd]] = value;
  saveData(data);
  await bot.sendMessage(msg.chat.id, `✅ Updated: ${setters[cmd]}\n\n${value}`, { reply_markup: adminMenu(), disable_web_page_preview: true });
});

bot.on('polling_error', (err) => console.error('Polling error:', err.message));
console.log('TRINTOPE Bot v2.5 admin started');
