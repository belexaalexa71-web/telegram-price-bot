import { store } from '../database/store.js';

export function isPrivate(ctx) { return ctx.chat?.type === 'private'; }
export function isGroup(ctx) { return ['group','supergroup'].includes(ctx.chat?.type); }
export function isOwner(ctx) { return store.isOwner(ctx.from?.id); }
export function requireOwner(ctx) {
  if (!isPrivate(ctx) || !isOwner(ctx)) return false;
  return true;
}
