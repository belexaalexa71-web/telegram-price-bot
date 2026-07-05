import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { startCommand } from './commands/start.js';
import { idCommand, setupOwnerCommand } from './commands/owner.js';
import { callbackHandler } from './handlers/callback.js';
import { textHandler } from './handlers/messages.js';

const bot = new Telegraf(config.botToken);

bot.start(startCommand);
bot.command('help', startCommand);
bot.command('id', idCommand);
bot.command('setup_owner', setupOwnerCommand);
bot.on('callback_query', callbackHandler);
bot.on('text', textHandler);

bot.catch((err) => console.error('Bot error:', err));

bot.launch();
console.log('TRINTOPE Bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
