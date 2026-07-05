import { Telegraf } from 'telegraf';
import { config, requireConfig } from './config.js';
import { initDb } from './services/db.js';
import { handleCallback } from './handlers/callbacks.js';
import { handleStart, handleSetupOwner, handleId, handleText } from './handlers/messages.js';

requireConfig();
await initDb();

const bot = new Telegraf(config.botToken);

bot.start(handleStart);
bot.command('id', handleId);
bot.command('setup_owner', handleSetupOwner);
bot.command('help', handleStart);
bot.on('callback_query', handleCallback);
bot.on('text', handleText);

bot.catch((err) => console.error('Bot error:', err));

await bot.launch();
console.log(`${config.version} started`);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
