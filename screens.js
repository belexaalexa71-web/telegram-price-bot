const { Markup } = require('telegraf');
const { homeKeyboard } = require('../keyboards/home');
const { adminKeyboard, statusKeyboard, linksKeyboard } = require('../keyboards/admin');
const { getSettingsMap, setSetting } = require('../database/settings');
const { isOwner } = require('../database/owners');
const { getStats } = require('../database/users');
const { addLog, recentLogs } = require('../database/logs');
const { editOrReply } = require('../services/render');
const { setPending } = require('../services/sessions');

async function home(ctx) {
  const settings = await getSettingsMap();
  const owner = await isOwner(ctx);
  const text = `🔷 <b>TRINTOPE</b>\n\nOfficial Project Assistant\n\nStatus: <b>${settings.project_status || 'Development'}</b>\nVersion: <b>${settings.version || '0.2.0'}</b>\n\nChoose an option below.`;
  return editOrReply(ctx, text, homeKeyboard(owner));
}

async function market(ctx) {
  return editOrReply(ctx, '📊 <b>Market</b>\n\nToken is not live yet.\n\nPrice, chart and buy links will be enabled after launch.', Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]]));
}

async function community(ctx) {
  const settings = await getSettingsMap();
  return editOrReply(ctx, `🌍 <b>Community</b>\n\n🌐 Website:\n${settings.website_url}\n\n🐦 X:\n${settings.x_url}\n\n💬 Telegram:\n${settings.telegram_url}`, Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]]));
}

async function project(ctx) {
  return editOrReply(ctx, '📚 <b>Project</b>\n\nRoadmap, tokenomics and FAQ will be managed through the Control Center.', Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]]));
}

async function help(ctx) {
  return editOrReply(ctx, '❓ <b>Help</b>\n\nUse the buttons to navigate.\nIn groups, open the bot in private chat for a clean experience.', Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'home'), Markup.button.callback('❌ Close', 'close')]]));
}

async function admin(ctx) {
  if (!(await isOwner(ctx))) return ctx.answerCbQuery('Access denied');
  return editOrReply(ctx, '🔒 <b>TRINTOPE Control Center</b>\n\nManage project data from Telegram.\n\nDatabase: <b>PostgreSQL</b>\nSprint: <b>2.2</b>', adminKeyboard());
}

async function adminStatus(ctx) {
  if (!(await isOwner(ctx))) return ctx.answerCbQuery('Access denied');
  const settings = await getSettingsMap();
  return editOrReply(ctx, `🟢 <b>Project Status</b>\n\nCurrent: <b>${settings.project_status}</b>`, statusKeyboard());
}

async function setStatus(ctx, status) {
  if (!(await isOwner(ctx))) return ctx.answerCbQuery('Access denied');
  await setSetting('project_status', status);
  await addLog(ctx, 'status_changed', status);
  await ctx.answerCbQuery(`Status set to ${status}`);
  return adminStatus(ctx);
}

async function adminLinks(ctx) {
  if (!(await isOwner(ctx))) return ctx.answerCbQuery('Access denied');
  const settings = await getSettingsMap();
  return editOrReply(ctx, `🔗 <b>Project Links</b>\n\n🌐 Website:\n${settings.website_url}\n\n🐦 X:\n${settings.x_url}\n\n💬 Telegram:\n${settings.telegram_url}\n\nChoose what to edit.`, linksKeyboard());
}

async function awaitInput(ctx, key) {
  if (!(await isOwner(ctx))) return ctx.answerCbQuery('Access denied');
  setPending(ctx.from.id, key);
  await ctx.answerCbQuery('Send new value in chat');
  return editOrReply(ctx, `✍️ <b>Editing ${key}</b>\n\nSend the new value as your next message.\n\nUse ❌ Close to cancel.`, Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'admin_links'), Markup.button.callback('❌ Close', 'close')]]));
}

async function adminStats(ctx) {
  if (!(await isOwner(ctx))) return ctx.answerCbQuery('Access denied');
  const stats = await getStats();
  return editOrReply(ctx, `📊 <b>Stats</b>\n\nUsers total: <b>${stats.total}</b>\nNew today: <b>${stats.today}</b>\nTotal launches: <b>${stats.launches}</b>`, Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'admin'), Markup.button.callback('❌ Close', 'close')]]));
}

async function adminLogs(ctx) {
  if (!(await isOwner(ctx))) return ctx.answerCbQuery('Access denied');
  const logs = await recentLogs(8);
  const body = logs.length ? logs.map((log) => `• ${log.action}: ${log.details || '-'}`).join('\n') : 'No logs yet.';
  return editOrReply(ctx, `📋 <b>Recent Logs</b>\n\n${body}`, Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'admin'), Markup.button.callback('❌ Close', 'close')]]));
}

module.exports = { home, market, community, project, help, admin, adminStatus, setStatus, adminLinks, awaitInput, adminStats, adminLogs };
