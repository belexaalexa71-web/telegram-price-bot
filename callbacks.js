const screens = require('./screens');

async function handleCallback(ctx) {
  const data = ctx.callbackQuery?.data || '';

  if (data === 'close') {
    try { await ctx.deleteMessage(); } catch (_) {}
    return;
  }

  if (data === 'home') return screens.home(ctx);
  if (data === 'market') return screens.market(ctx);
  if (data === 'community') return screens.community(ctx);
  if (data === 'project') return screens.project(ctx);
  if (data === 'help') return screens.help(ctx);
  if (data === 'admin') return screens.admin(ctx);
  if (data === 'admin_status') return screens.adminStatus(ctx);
  if (data === 'admin_links') return screens.adminLinks(ctx);
  if (data === 'admin_stats') return screens.adminStats(ctx);
  if (data === 'admin_logs') return screens.adminLogs(ctx);

  if (data.startsWith('set_status:')) return screens.setStatus(ctx, data.split(':')[1]);
  if (data.startsWith('await:')) return screens.awaitInput(ctx, data.split(':')[1]);

  return ctx.answerCbQuery('Unknown action');
}

module.exports = { handleCallback };
