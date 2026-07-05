import { store } from '../database/store.js';
import { showHome } from '../commands/start.js';
import { backKeyboard, marketKeyboard, communityKeyboard } from '../keyboards/user.js';
import { adminKeyboard, statusKeyboard, editKeyboard } from '../keyboards/admin.js';
import { isOwner } from '../services/security.js';
export async function onCallback(ctx){
  const a = ctx.callbackQuery.data; await ctx.answerCbQuery().catch(()=>{}); const d=store.get();
  if(a==='close') return ctx.deleteMessage().catch(()=>{});
  if(a==='home') return showHome(ctx,true);
  if(a==='market') return ctx.editMessageText('📊 Market\n\nToken data will be available after launch.', marketKeyboard());
  if(a==='price') return ctx.editMessageText('💰 Price\n\nToken is not live yet.', backKeyboard());
  if(a==='chart') return ctx.editMessageText('📈 Chart\n\nChart will be available after launch.', backKeyboard());
  if(a==='buy') return ctx.editMessageText('🛒 Buy\n\nTrading is not available yet.', backKeyboard());
  if(a==='community') return ctx.editMessageText('🌍 Official Community\n\nUse only official links below.', communityKeyboard(d.settings.website, d.settings.xUrl));
  if(a==='project') return ctx.editMessageText(`📚 Project\n\n🗺 Roadmap:\n${d.roadmap}\n\n💎 Tokenomics:\n${d.tokenomics}`, backKeyboard());
  if(a==='faq') return ctx.editMessageText(`❓ FAQ\n\n${d.faq}`, backKeyboard());
  if(a.startsWith('admin') || a.startsWith('set_status') || a.startsWith('edit:')) { if(!isOwner(ctx)) return ctx.answerCbQuery('Access denied'); }
  if(a==='admin_home') return ctx.editMessageText('🔒 TRINTOPE Control Center\n\nManage project content and settings.', adminKeyboard());
  if(a==='admin_status') return ctx.editMessageText(`🟢 Project Status\n\nCurrent: ${d.settings.status}`, statusKeyboard());
  if(a.startsWith('set_status:')) { const status=a.split(':')[1]; store.set(x=>{x.settings.status=status; x.logs.unshift({at:new Date().toISOString(),userId:String(ctx.from.id),action:`STATUS:${status}`})}); return ctx.editMessageText(`✅ Status updated: ${status}`, adminKeyboard()); }
  if(a==='admin_links') return ctx.editMessageText(`🔗 Links\n\nWebsite: ${d.settings.website}\nX: ${d.settings.xUrl}\n\nTo edit, send:\n/set_website URL\n/set_x URL`, editKeyboard('links'));
  if(a==='admin_news') return ctx.editMessageText(`📢 News\n\n${d.news}\n\nTo edit, send:\n/set_news text`, editKeyboard('news'));
  if(a==='admin_roadmap') return ctx.editMessageText(`🗺 Roadmap\n\n${d.roadmap}\n\nTo edit, send:\n/set_roadmap text`, editKeyboard('roadmap'));
  if(a==='admin_tokenomics') return ctx.editMessageText(`💎 Tokenomics\n\n${d.tokenomics}\n\nTo edit, send:\n/set_tokenomics text`, editKeyboard('tokenomics'));
  if(a==='admin_faq') return ctx.editMessageText(`❓ FAQ\n\n${d.faq}\n\nTo edit, send:\n/set_faq text`, editKeyboard('faq'));
  if(a==='admin_stats') return ctx.editMessageText(`📊 Stats\n\nUsers: ${Object.keys(d.users).length}\nLogs: ${d.logs.length}`, adminKeyboard());
  if(a==='admin_logs') return ctx.editMessageText(`📋 Last Logs\n\n${d.logs.slice(0,8).map(l=>`${l.at} — ${l.action}`).join('\n') || 'No logs yet.'}`, adminKeyboard());
}
