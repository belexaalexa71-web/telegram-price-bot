import { Markup } from 'telegraf';
import { config } from '../config.js';
import { addOwner, ownerCount, isOwner, setSetting, logAction, trackUser } from '../services/db.js';
import { popAwaiting } from '../services/session.js';
import { home } from './screens.js';

export async function safeDelete(ctx) { try { await ctx.deleteMessage(); } catch {} }

export async function showHome(ctx) {
  await trackUser(ctx.from);
  const screen = await home(ctx);
  return ctx.reply(screen.text, { reply_markup: screen.keyboard.reply_markup, disable_web_page_preview: true });
}

export async function handleStart(ctx) {
  await safeDelete(ctx);
  if (ctx.chat.type !== 'private') {
    const botName = ctx.botInfo?.username || config.publicBotUsername;
    const openUrl = botName ? `https://t.me/${botName}` : 'https://t.me/';
    const m = await ctx.reply('🔒 Open the official TRINTOPE Bot in private chat.', Markup.inlineKeyboard([[Markup.button.url('Open Bot', openUrl)]]));
    setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{}), 8000);
    return;
  }
  return showHome(ctx);
}

export async function handleSetupOwner(ctx) {
  await safeDelete(ctx);
  if (ctx.chat.type !== 'private') return;
  const parts = ctx.message.text.split(' ');
  const code = parts.slice(1).join(' ').trim();
  if (await ownerCount() > 0 && !(await isOwner(ctx.from.id))) return ctx.reply('Owner already configured.');
  if (!config.ownerSetupCode || code !== config.ownerSetupCode) return ctx.reply('Invalid setup code.');
  await addOwner(ctx.from.id);
  await logAction(ctx.from.id, 'Owner registered');
  return ctx.reply('✅ Owner access enabled. Send /start to open Control Center.');
}

export async function handleId(ctx) {
  await safeDelete(ctx);
  if (ctx.chat.type !== 'private') return;
  const m = await ctx.reply(`Your Telegram ID:\n${ctx.from.id}`);
  setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, m.message_id).catch(()=>{}), 15000);
}

export async function handleText(ctx) {
  if (ctx.chat.type !== 'private') return safeDelete(ctx);
  if (ctx.message.text === '/cancel') { popAwaiting(ctx.from.id); await safeDelete(ctx); return ctx.reply('Cancelled.'); }
  const pending = popAwaiting(ctx.from.id);
  if (!pending) return;
  if (!(await isOwner(ctx.from.id))) return;
  await setSetting(pending.key, ctx.message.text);
  await logAction(ctx.from.id, `Updated ${pending.key}`);
  await safeDelete(ctx);
  return ctx.reply(`✅ Updated: ${pending.key}`);
}
