import { Markup } from 'telegraf';
import { deleteIncoming } from '../services/security.js';
export async function groupCommand(ctx){
  await deleteIncoming(ctx);
  const username = ctx.botInfo?.username;
  const msg = await ctx.reply('🔒 Use TRINTOPE Bot in private chat.', Markup.inlineKeyboard([[Markup.button.url('Open TRINTOPE Bot', `https://t.me/${username}`)]]));
  setTimeout(()=>ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(()=>{}), 10000);
}
