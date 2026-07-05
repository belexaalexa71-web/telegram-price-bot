const { Markup } = require('telegraf');

function homeKeyboard(isOwner) {
  const rows = [
    [Markup.button.callback('📊 Market', 'market'), Markup.button.callback('🌍 Community', 'community')],
    [Markup.button.callback('📚 Project', 'project'), Markup.button.callback('❓ Help', 'help')],
    [Markup.button.callback('❌ Close', 'close')],
  ];

  if (isOwner) rows.splice(2, 0, [Markup.button.callback('🔒 Control Center', 'admin')]);
  return Markup.inlineKeyboard(rows);
}

module.exports = { homeKeyboard };
