import { store } from '../database/store.js';
import { isOwner, deleteIncoming } from '../services/security.js';
const map = { '/set_news':'news', '/set_roadmap':'roadmap', '/set_tokenomics':'tokenomics', '/set_faq':'faq' };
export async function onText(ctx){
  if(ctx.chat.type !== 'private') return;
  const text = ctx.message.text || '';
  if(!isOwner(ctx)) return;
  const cmd = Object.keys(map).find(c=>text.startsWith(c+' '));
  if(cmd){ await deleteIncoming(ctx); const value=text.slice(cmd.length).trim(); store.set(d=>{d[map[cmd]]=value; d.logs.unshift({at:new Date().toISOString(), userId:String(ctx.from.id), action:`EDIT:${map[cmd]}`});}); return ctx.reply('✅ Saved. Open /start.'); }
  if(text.startsWith('/set_website ')){ await deleteIncoming(ctx); const value=text.slice(13).trim(); store.set(d=>{d.settings.website=value; d.logs.unshift({at:new Date().toISOString(),userId:String(ctx.from.id),action:'EDIT:website'});}); return ctx.reply('✅ Website saved.'); }
  if(text.startsWith('/set_x ')){ await deleteIncoming(ctx); const value=text.slice(7).trim(); store.set(d=>{d.settings.xUrl=value; d.logs.unshift({at:new Date().toISOString(),userId:String(ctx.from.id),action:'EDIT:x'});}); return ctx.reply('✅ X saved.'); }
}
