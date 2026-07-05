import { nav } from '../keyboards/navigation.js';
import { homeText, helpText } from '../keyboards/texts.js';
import { store } from '../database/store.js';
import { isOwner } from '../services/security.js';

async function edit(ctx, text, keyboard) {
  await ctx.editMessageText(text, { reply_markup: keyboard }).catch(async () => {
    await ctx.reply(text, { reply_markup: keyboard });
  });
}

export async function callbackHandler(ctx) {
  const data = ctx.callbackQuery.data;
  store.trackUser(ctx.from);
  await ctx.answerCbQuery().catch(() => {});

  if (data === 'close') return ctx.deleteMessage().catch(() => {});
  if (data === 'home') return edit(ctx, homeText(), nav.main(isOwner(ctx)));

  if (data === 'market') return edit(ctx, '📊 Market\n\nToken data will become available after launch.', nav.market());
  if (data === 'price') return edit(ctx, '💰 Price\n\nToken is not live yet.', nav.market());
  if (data === 'chart') return edit(ctx, '📈 Chart\n\nChart will be available after launch.', nav.market());
  if (data === 'buy') return edit(ctx, '🛒 Buy\n\nTrading is not available yet.', nav.market());
  if (data === 'community') return edit(ctx, '🌍 Community\n\nUse only official TRINTOPE links.', nav.community(store.getSetting('websiteUrl'), store.getSetting('xUrl')));
  if (data === 'project') return edit(ctx, '📚 Project\n\nChoose a project section.', nav.project());
  if (data === 'news') return edit(ctx, `📢 News\n\n${store.getSetting('news')}`, nav.project());
  if (data === 'roadmap') return edit(ctx, `🗺 Roadmap\n\n${store.getSetting('roadmap')}`, nav.project());
  if (data === 'tokenomics') return edit(ctx, `💎 Tokenomics\n\n${store.getSetting('tokenomics')}`, nav.project());
  if (data === 'faq') return edit(ctx, `❓ FAQ\n\n${store.getSetting('faq')}`, nav.project());
  if (data === 'help') return edit(ctx, helpText(), nav.main(isOwner(ctx)));

  if (data.startsWith('admin') || data.startsWith('set_status')) {
    if (!isOwner(ctx)) return ctx.answerCbQuery('Access denied', { show_alert: true }).catch(() => {});
    if (data === 'admin') return edit(ctx, '🔒 TRINTOPE Control Center\n\nWelcome back, Owner.\n\nManage the project from one place.', nav.admin());
    if (data === 'admin_status') return edit(ctx, `🟢 Project Status\n\nCurrent: ${store.getSetting('status')}`, nav.status());
    if (data.startsWith('set_status:')) {
      const status = data.split(':')[1]; store.setSetting('status', status); store.log(ctx.from.id, `Status changed to ${status}`);
      return edit(ctx, `✅ Status updated: ${status}`, nav.backAdmin());
    }
    if (data === 'admin_links') return edit(ctx, `🔗 Links\n\nWebsite:\n${store.getSetting('websiteUrl')}\n\nX:\n${store.getSetting('xUrl')}\n\nTo edit, send:\n/set_website URL\n/set_x URL`, nav.backAdmin());
    if (data === 'admin_news') return edit(ctx, '📢 News\n\nTo edit, send:\n/set_news your text', nav.backAdmin());
    if (data === 'admin_roadmap') return edit(ctx, '🗺 Roadmap\n\nTo edit, send:\n/set_roadmap your text', nav.backAdmin());
    if (data === 'admin_tokenomics') return edit(ctx, '💎 Tokenomics\n\nTo edit, send:\n/set_tokenomics your text', nav.backAdmin());
    if (data === 'admin_faq') return edit(ctx, '❓ FAQ\n\nTo edit, send:\n/set_faq your text', nav.backAdmin());
    if (data === 'admin_stats') {
      const s = store.stats(); return edit(ctx, `📊 Stats\n\nUsers: ${s.users}\nLogs: ${s.logs}\nStatus: ${s.status}`, nav.backAdmin());
    }
    if (data === 'admin_logs') {
      const logs = store.logs().map(l => `${l.at.slice(0,16).replace('T',' ')} — ${l.action}`).join('\n') || 'No logs yet.';
      return edit(ctx, `📜 Logs\n\n${logs}`, nav.backAdmin());
    }
  }
}
