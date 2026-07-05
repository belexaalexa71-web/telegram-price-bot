const { Markup } = require('telegraf');
const { ownerSetupCode } = require('../config');
const { safeDelete } = require('../services/render');
const { upsertUser } = require('../database/users');
const { isOwner, ownerExists, addOwner } = require('../database/owners');
const { setSetting } = require('../database/settings');
const { addLog } = require('../database/logs');
const { getPending, clearPending } = require('../services/sessions');
const screens = require('./screens');

function isPrivate(ctx) { return ctx.chat?.type === 'private'; }

async function handleStart(ctx) {
  await upsertUser(ctx);
  await safeDelete(ctx);

  if (!isPrivate(ctx)) {
    const me = await ctx.telegram.getMe();
    const msg = await ctx.reply('🔒 Open the official TRINTOPE Bot in private chat.', Markup.inlineKeyboard([
      [Markup.button.url('Open TRINTOPE Bot', `https://t.me/${me.username}`)]
    ]));
    setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 15000);
    return;
  }

  return screens.home(ctx);
}

async function handleId(ctx) {
  await safeDelete(ctx);
  return ctx.reply(`Your Telegram ID: ${ctx.from.id}`);
}

async function handleSetupOwner(ctx) {
  await safeDelete(ctx);
  if (!isPrivate(ctx)) return;

  const exists = await ownerExists();
  if (exists) return ctx.reply('Owner already configured.');

  const code = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (!ownerSetupCode || code !== ownerSetupCode) return ctx.reply('Invalid setup code.');

  await addOwner(ctx);
  await addLog(ctx, 'owner_setup', ctx.from.username || String(ctx.from.id));
  return ctx.reply('✅ Owner access activated. Control Center is now available.');
}

async function handleText(ctx) {
  await upsertUser(ctx);

  if (!isPrivate(ctx)) return;

  const pending = getPending(ctx.from.id);
  if (!pending) return;

  if (!(await isOwner(ctx))) return;

  const value = ctx.message.text.trim();
  await setSetting(pending, value);
  await addLog(ctx, 'setting_updated', pending);
  clearPending(ctx.from.id);
  await safeDelete(ctx);
  return ctx.reply(`✅ Updated ${pending}. Open /start to view changes.`);
}

module.exports = { handleStart, handleId, handleSetupOwner, handleText };
