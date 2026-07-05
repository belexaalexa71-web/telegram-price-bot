import { Markup } from 'telegraf';
export const adminKeyboard = () => Markup.inlineKeyboard([
  [Markup.button.callback('🟢 Status','admin_status'), Markup.button.callback('🔗 Links','admin_links')],
  [Markup.button.callback('📢 News','admin_news'), Markup.button.callback('🗺 Roadmap','admin_roadmap')],
  [Markup.button.callback('💎 Tokenomics','admin_tokenomics'), Markup.button.callback('❓ FAQ','admin_faq')],
  [Markup.button.callback('📊 Stats','admin_stats'), Markup.button.callback('📋 Logs','admin_logs')],
  [Markup.button.callback('⬅ Back','home'), Markup.button.callback('❌ Close','close')]
]);
export const statusKeyboard = () => Markup.inlineKeyboard([
  [Markup.button.callback('Building','set_status:Building'), Markup.button.callback('Presale','set_status:Presale'), Markup.button.callback('Live','set_status:Live')],
  [Markup.button.callback('⬅ Control Center','admin_home')]
]);
export const editKeyboard = (field) => Markup.inlineKeyboard([
  [Markup.button.callback(`✏️ Edit ${field}` , `edit:${field}`)],
  [Markup.button.callback('⬅ Control Center','admin_home')]
]);
