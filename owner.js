import { config } from '../config.js';
import { store } from '../database/store.js';
import { deleteIncoming } from '../services/security.js';
export async function idCommand(ctx){ await deleteIncoming(ctx); await ctx.reply(`Your Telegram ID: ${ctx.from.id}`); }
export async function setupOwner(ctx){
  const code = ctx.message?.text?.split(' ').slice(1).join(' ').trim();
  await deleteIncoming(ctx);
  const data = store.get();
  if (data.ownerId) return ctx.reply('Owner is already configured.');
  if (!config.ownerSetupCode || code !== config.ownerSetupCode) return ctx.reply('Invalid setup code.');
  store.set(d => { d.ownerId = String(ctx.from.id); d.logs.unshift({ at:new Date().toISOString(), userId:String(ctx.from.id), action:'OWNER_SETUP' }); });
  return ctx.reply('✅ Owner configured. Open /start.');
}
