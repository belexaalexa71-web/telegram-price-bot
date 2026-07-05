import { config } from '../config.js';
import { store } from '../database/store.js';
import { deleteUserCommand } from '../services/cleanup.js';

export async function idCommand(ctx) {
  await deleteUserCommand(ctx);
  const msg = await ctx.reply(`Your Telegram ID:\n${ctx.from.id}`);
  setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 30000);
}

export async function setupOwnerCommand(ctx) {
  await deleteUserCommand(ctx);
  if (ctx.chat.type !== 'private') return;
  if (store.getOwnerId()) {
    await ctx.reply('Owner is already configured.');
    return;
  }
  const code = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (!config.ownerSetupCode || code !== config.ownerSetupCode) {
    await ctx.reply('Invalid setup code.');
    return;
  }
  store.setOwnerId(ctx.from.id);
  store.log(ctx.from.id, 'Owner configured');
  await ctx.reply('✅ Owner configured. Send /start to open Control Center.');
}
