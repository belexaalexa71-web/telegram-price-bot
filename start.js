import { nav } from '../keyboards/navigation.js';
import { homeText } from '../keyboards/texts.js';
import { scheduleMenuCleanup, deleteUserCommand } from '../services/cleanup.js';
import { isGroup, isOwner } from '../services/security.js';
import { store } from '../database/store.js';

export async function startCommand(ctx) {
  store.trackUser(ctx.from);
  await deleteUserCommand(ctx);
  if (isGroup(ctx)) {
    const bot = await ctx.telegram.getMe();
    const msg = await ctx.reply('🔒 Open the official TRINTOPE Bot in private chat.', {
      reply_markup: { inline_keyboard: [[{ text: 'Open TRINTOPE Bot', url: `https://t.me/${bot.username}` }]] }
    });
    setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 15000);
    return;
  }
  const sent = await ctx.reply(homeText(), { reply_markup: nav.main(isOwner(ctx)) });
  scheduleMenuCleanup(ctx, ctx.chat.id, sent.message_id);
}
