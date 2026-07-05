export const cb = (text, data) => ({ text, callback_data: data });
export const url = (text, url) => ({ text, url });
export function mainKb(isOwner=false){ const rows=[ [cb('📊 Market','market'), cb('📚 Project','project')], [cb('🌍 Community','community'), cb('❓ Help','help')], [cb('❌ Close','close')] ]; if(isOwner) rows.splice(2,0,[cb('🔒 Control Center','admin')]); return { inline_keyboard: rows }; }
export const navKb = { inline_keyboard: [[cb('⬅️ Back','home'), cb('❌ Close','close')]] };
export function adminKb(){ return { inline_keyboard: [ [cb('📢 Content','admin_content'), cb('🌐 Project','admin_project')], [cb('📊 Analytics','admin_stats'), cb('⚙️ System','admin_system')], [cb('⬅️ Back','home'), cb('❌ Close','close')] ] }; }
export function editKb(section){ return { inline_keyboard: [[cb('✏️ Edit','edit_'+section)], [cb('⬅️ Back','admin'), cb('❌ Close','close')]] }; }
export function statusKb(){ return { inline_keyboard: [[cb('🟢 Building','set_status:Building'), cb('🟡 Presale','set_status:Presale')], [cb('🚀 Live','set_status:Live')], [cb('⬅️ Back','admin_project')]]}; }
