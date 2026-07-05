import { config } from '../config.js';
const timers = new Map();

export function scheduleMenuCleanup(ctx, chatId, messageId) {
  const key = `${chatId}:${messageId}`;
  clearTimeout(timers.get(key));
  timers.set(key, setTimeout(async () => {
    try { await ctx.telegram.deleteMessage(chatId, messageId); } catch {}
    timers.delete(key);
  }, config.menuTtlMs));
}

export async function deleteUserCommand(ctx) {
  try { await ctx.deleteMessage(ctx.message.message_id); } catch {}
}
