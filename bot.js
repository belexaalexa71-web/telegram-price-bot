const { Telegraf } = require('telegraf');
const { botToken } = require('./config');
const { testConnection } = require('./database/connection');
const { initDatabase } = require('./database/migrations');
const { handleCallback } = require('./handlers/callbacks');
const { handleStart, handleId, handleSetupOwner, handleText } = require('./handlers/messages');

async function startBot() {
  await testConnection();
  await initDatabase();

  const bot = new Telegraf(botToken);

  bot.start(handleStart);
  bot.command('id', handleId);
  bot.command('setup_owner', handleSetupOwner);
  bot.on('callback_query', handleCallback);
  bot.on('text', handleText);

  bot.catch((error, ctx) => {
    console.error(`Bot error for update ${ctx.update?.update_id}:`, error);
  });

  await bot.launch();
  console.log('✅ TRINTOPE Bot v0.2.0 launched');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { startBot };
