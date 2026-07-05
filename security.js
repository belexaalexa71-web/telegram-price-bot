import { config } from '../config.js';
import { store } from '../database/store.js';
export function userId(ctx){ return String(ctx.from?.id || ''); }
export function isOwner(ctx){ const id = userId(ctx); const data = store.get(); return Boolean(id && (String(data.ownerId) === id || config.adminIds.includes(id))); }
export function isPrivate(ctx){ return ctx.chat?.type === 'private'; }
export async function deleteIncoming(ctx){ try { if (ctx.message?.message_id) await ctx.deleteMessage(ctx.message.message_id); } catch {} }
