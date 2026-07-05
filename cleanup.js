import { config } from '../config.js';
const timers = new Map();
export function scheduleMenuDelete(ctx, chatId, messageId){
  const key = `${chatId}:${messageId}`;
  clearTimeout(timers.get(key));
  timers.set(key, setTimeout(async()=>{ try { await ctx.telegram.deleteMessage(chatId, messageId); } catch {} timers.delete(key); }, config.menuTtlMs));
}
