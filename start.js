import { store } from '../database/store.js';
import { homeKeyboard } from '../keyboards/user.js';
import { isOwner, deleteIncoming } from '../services/security.js';
import { scheduleMenuDelete } from '../services/cleanup.js';
export async function showHome(ctx, edit=false){
  const data = store.get();
  const text = `🔷 TRINTOPE\n\nOfficial Project Assistant\n\n🟢 Status: ${data.settings.status}\n\n${data.settings.welcome}\n\nChoose an option below.`;
  const kb = homeKeyboard(isOwner(ctx));
  let msg;
  if (edit && ctx.callbackQuery) msg = await ctx.editMessageText(text, kb); else msg = await ctx.reply(text, kb);
  const chatId = ctx.chat?.id || ctx.callbackQuery?.message?.chat?.id;
  const messageId = msg?.message_id || ctx.callbackQuery?.message?.message_id;
  if (chatId && messageId) scheduleMenuDelete(ctx, chatId, messageId);
}
export async function startCommand(ctx){ await deleteIncoming(ctx); await showHome(ctx); store.set(d => { d.users[String(ctx.from.id)] = { firstName: ctx.from.first_name, lastSeen: new Date().toISOString() }; }); }
