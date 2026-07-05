const { Markup } = require('telegraf');

function adminKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🟢 Status', 'admin_status'), Markup.button.callback('🔗 Links', 'admin_links')],
    [Markup.button.callback('📊 Stats', 'admin_stats'), Markup.button.callback('📋 Logs', 'admin_logs')],
    [Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')],
  ]);
}

function statusKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🟢 Development', 'set_status:Development')],
    [Markup.button.callback('🟡 Presale', 'set_status:Presale')],
    [Markup.button.callback('🚀 Live', 'set_status:Live')],
    [Markup.button.callback('⬅️ Back', 'admin'), Markup.button.callback('❌ Close', 'close')],
  ]);
}

function linksKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🌐 Set Website', 'await:website_url')],
    [Markup.button.callback('🐦 Set X', 'await:x_url')],
    [Markup.button.callback('💬 Set Telegram', 'await:telegram_url')],
    [Markup.button.callback('⬅️ Back', 'admin'), Markup.button.callback('❌ Close', 'close')],
  ]);
}

module.exports = { adminKeyboard, statusKeyboard, linksKeyboard };
