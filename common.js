const { Markup } = require('telegraf');

function backClose(backAction = 'home') {
  return [
    Markup.button.callback('⬅️ Back', backAction),
    Markup.button.callback('❌ Close', 'close'),
  ];
}

module.exports = { backClose };
