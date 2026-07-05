import { Markup } from 'telegraf';
export const homeKeyboard = (owner=false) => Markup.inlineKeyboard([
  [Markup.button.callback('📊 Market','market'), Markup.button.callback('🌍 Community','community')],
  [Markup.button.callback('📚 Project','project'), Markup.button.callback('❓ FAQ','faq')],
  owner ? [Markup.button.callback('🔒 Control Center','admin_home')] : [],
  [Markup.button.callback('❌ Close','close')]
].filter(r=>r.length));
export const backKeyboard = () => Markup.inlineKeyboard([[Markup.button.callback('⬅ Back','home'), Markup.button.callback('❌ Close','close')]]);
export const marketKeyboard = () => Markup.inlineKeyboard([
  [Markup.button.callback('💰 Price','price'), Markup.button.callback('📈 Chart','chart')],
  [Markup.button.callback('🛒 Buy','buy')],
  [Markup.button.callback('⬅ Back','home'), Markup.button.callback('❌ Close','close')]
]);
export const communityKeyboard = (website, xUrl) => Markup.inlineKeyboard([
  [Markup.button.url('🌐 Website', website)],
  [Markup.button.url('🐦 X', xUrl)],
  [Markup.button.callback('⬅ Back','home'), Markup.button.callback('❌ Close','close')]
]);
