import { nav } from '../keyboards/navigation.js';
import {
  adminPanelText,
  adminStatusText,
  adminLinksText,
  adminStatsText,
  adminLogsText,
  adminEditHint,
  setStatus
} from './panel.js';
import { isOwner } from '../services/security.js';

export async function handleAdminCallback(ctx, edit) {
  const data = ctx.callbackQuery.data;

  if (!isOwner(ctx)) {
    await ctx.answerCbQuery('Access denied', { show_alert: true }).catch(() => {});
    return true;
  }

  if (data === 'admin') return edit(ctx, adminPanelText(), nav.admin());
  if (data === 'admin_status') return edit(ctx, adminStatusText(), nav.status());
  if (data === 'admin_links') return edit(ctx, adminLinksText(), nav.backAdmin());
  if (data === 'admin_news') return edit(ctx, adminEditHint('📢 News', '/set_news'), nav.backAdmin());
  if (data === 'admin_roadmap') return edit(ctx, adminEditHint('🗺 Roadmap', '/set_roadmap'), nav.backAdmin());
  if (data === 'admin_tokenomics') return edit(ctx, adminEditHint('💎 Tokenomics', '/set_tokenomics'), nav.backAdmin());
  if (data === 'admin_faq') return edit(ctx, adminEditHint('❓ FAQ', '/set_faq'), nav.backAdmin());
  if (data === 'admin_stats') return edit(ctx, adminStatsText(), nav.backAdmin());
  if (data === 'admin_logs') return edit(ctx, adminLogsText(), nav.backAdmin());

  if (data.startsWith('set_status:')) {
    const status = data.split(':')[1];
    return edit(ctx, setStatus(ctx, status), nav.backAdmin());
  }

  return false;
}
