import { home, market, project, community, help, simpleSetting, admin, adminContent, adminProject, adminAnalytics, adminSystem, statusMenu, linksMenu, logsScreen, versionScreen } from './screens.js';
import { isOwner, setSetting, logAction } from '../services/db.js';
import { setAwaiting } from '../services/session.js';

async function render(ctx, screen) {
  try { await ctx.editMessageText(screen.text, { reply_markup: screen.keyboard.reply_markup, disable_web_page_preview: true }); }
  catch { await ctx.reply(screen.text, { reply_markup: screen.keyboard.reply_markup, disable_web_page_preview: true }); }
}

const editMap = { welcome:'Welcome text', news:'News', faq:'FAQ', roadmap:'Roadmap', tokenomics:'Tokenomics', whitepaper:'Whitepaper', website:'Website URL', x:'X URL' };

export async function handleCallback(ctx) {
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery().catch(()=>{});
  if (data === 'close') return ctx.deleteMessage().catch(()=>{});

  const ownerOnly = data.startsWith('admin') || data.startsWith('edit:') || data.startsWith('set_status') || ['status_menu','links_menu','logs','version'].includes(data);
  if (ownerOnly && !(await isOwner(ctx.from.id))) return ctx.answerCbQuery('Access denied', { show_alert: true });

  if (data.startsWith('edit:')) {
    const key = data.split(':')[1];
    setAwaiting(ctx.from.id, { type:'edit', key });
    return render(ctx, { text:`✏️ Edit ${editMap[key] || key}\n\nSend the new value as your next message.\n\nType /cancel to cancel.`, keyboard: { reply_markup: { inline_keyboard: [[{text:'⬅ Back', callback_data:'admin'}],[{text:'❌ Close', callback_data:'close'}]] } } });
  }
  if (data.startsWith('set_status:')) {
    const value = data.split(':')[1];
    await setSetting('project_status', value);
    await logAction(ctx.from.id, `Status changed to ${value}`);
    return render(ctx, await statusMenu());
  }

  const screens = {
    home: () => home(ctx), market, project, community, help,
    price: () => simpleSetting('💰 Price', 'price'), chart: () => simpleSetting('📈 Chart', 'chart'), buy: () => simpleSetting('🛒 Buy', 'buy'),
    news: () => simpleSetting('📢 News', 'news'), roadmap: () => simpleSetting('🗺 Roadmap', 'roadmap'), tokenomics: () => simpleSetting('💎 Tokenomics', 'tokenomics'), faq: () => simpleSetting('❓ FAQ', 'faq'),
    admin: () => admin(ctx), admin_content: adminContent, admin_project: adminProject, admin_analytics: adminAnalytics, admin_system: adminSystem,
    status_menu: statusMenu, links_menu: linksMenu, logs: logsScreen, version: versionScreen,
  };
  if (screens[data]) return render(ctx, await screens[data]());
}
