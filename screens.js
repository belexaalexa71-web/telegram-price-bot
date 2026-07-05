import { Markup } from 'telegraf';
import { allSettings, getSetting, stats, recentLogs, isOwner } from '../services/db.js';
import { btn, url, nav } from '../keyboards/ui.js';
import { config } from '../config.js';

export async function home(ctx) {
  const s = await allSettings();
  const owner = await isOwner(ctx.from.id);
  const rows = [
    [btn('📊 Market', 'market'), btn('📚 Project', 'project')],
    [btn('🌍 Community', 'community'), btn('❓ Help', 'help')],
  ];
  if (owner && ctx.chat.type === 'private') rows.push([btn('🔒 Control Center', 'admin')]);
  rows.push([btn('❌ Close', 'close')]);
  return { text: `🔷 TRINTOPE\n\nOfficial Project Assistant\n\n🟢 Status: ${s.project_status}\n\nChoose an option below.`, keyboard: Markup.inlineKeyboard(rows) };
}
export async function market() { return { text: '📊 Market\n\n💰 Price: Token is not live yet.\n📈 Chart: Available after launch.\n🛒 Buy: Trading is not available yet.', keyboard: nav([[btn('💰 Price','price'), btn('📈 Chart','chart')],[btn('🛒 Buy','buy')]]) }; }
export async function project() { return { text: '📚 Project\n\nProject information and updates.', keyboard: nav([[btn('📢 News','news'), btn('🗺 Roadmap','roadmap')],[btn('💎 Tokenomics','tokenomics'), btn('❓ FAQ','faq')]]) }; }
export async function community() { const s=await allSettings(); return { text: '🌍 Community\n\nUse only official TRINTOPE links.', keyboard: nav([[url('🌐 Website', s.website)],[url('🐦 X', s.x)]]) }; }
export async function help() { return { text: '❓ Help\n\nUse the buttons to navigate. In groups, the bot keeps the chat clean and opens menus only in private chat.', keyboard: nav([]) }; }
export async function simpleSetting(title, key) { return { text: `${title}\n\n${await getSetting(key)}`, keyboard: nav([],'project') }; }
export async function admin(ctx) { return { text: `🔒 TRINTOPE Control Center\n\nWelcome back, Owner.\n\nVersion: ${config.version}\n\nManage your ecosystem from one place.`, keyboard: Markup.inlineKeyboard([[btn('📢 Content','admin_content'), btn('🌐 Project','admin_project')],[btn('📊 Analytics','admin_analytics'), btn('⚙ System','admin_system')],[btn('🏠 Home','home'), btn('❌ Close','close')]]) }; }
export async function adminContent() { return { text:'📢 Content\n\nEdit public content from Telegram.', keyboard: nav([[btn('✏️ Welcome','edit:welcome'), btn('📢 News','edit:news')],[btn('❓ FAQ','edit:faq')]], 'admin') }; }
export async function adminProject() { return { text:'🌐 Project\n\nManage project data and links.', keyboard: nav([[btn('🟢 Status','status_menu'), btn('🔗 Links','links_menu')],[btn('🗺 Roadmap','edit:roadmap'), btn('💎 Tokenomics','edit:tokenomics')],[btn('📜 Whitepaper','edit:whitepaper')]], 'admin') }; }
export async function adminAnalytics() { const st=await stats(); return { text:`📊 Analytics\n\nUsers: ${st.users}\nStarts: ${st.starts}`, keyboard: nav([[btn('🔄 Refresh','admin_analytics')]], 'admin') }; }
export async function adminSystem() { return { text:'⚙ System\n\nSecurity and system tools.', keyboard: nav([[btn('📋 Logs','logs'), btn('ℹ Version','version')]], 'admin') }; }
export async function statusMenu() { return { text:'🟢 Project Status\n\nChoose current status.', keyboard: nav([[btn('🛠 Building','set_status:Building'), btn('🟡 Presale','set_status:Presale')],[btn('🚀 Live','set_status:Live')]], 'admin_project') }; }
export async function linksMenu() { return { text:'🔗 Links\n\nChoose link to edit.', keyboard: nav([[btn('🌐 Website','edit:website'), btn('🐦 X','edit:x')]], 'admin_project') }; }
export async function logsScreen() { const logs=await recentLogs(10); const text = logs.length ? logs.map(l=>`• ${new Date(l.created_at).toLocaleString()} — ${l.action}`).join('\n') : 'No logs yet.'; return { text:`📋 Recent Logs\n\n${text}`, keyboard: nav([], 'admin_system') }; }
export async function versionScreen() { return { text:`ℹ Version\n\n${config.version}`, keyboard: nav([], 'admin_system') }; }
