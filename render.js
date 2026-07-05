import { APP_VERSION } from '../config.js';
import { getSetting, stats } from '../database/db.js';
export async function isOwner(ctx){ return String(ctx.from?.id) === await getSetting('owner_id'); }
export async function homeText(){ const status=await getSetting('status'); const welcome=await getSetting('welcome'); return `🔷 TRINTOPE\n\nOfficial Project Assistant\n\n🟢 Status: ${status}\n\n${welcome}\n\nVersion: ${APP_VERSION}`; }
export async function screen(name){
 if(name==='market') return '📊 Market\n\n💰 Price: token is not live yet.\n📈 Chart: available after launch.\n🛒 Buy: available after launch.';
 if(name==='project') return `📚 Project\n\n🗺 Roadmap:\n${await getSetting('roadmap')}\n\n💎 Tokenomics:\n${await getSetting('tokenomics')}`;
 if(name==='community') return `🌍 Community\n\n🌐 Website:\n${await getSetting('website')}\n\n🐦 X:\n${await getSetting('x')}\n\n📢 News:\n${await getSetting('news')}`;
 if(name==='help') return '❓ Help\n\nUse the buttons to navigate. In groups, open the bot in private chat for a clean experience.';
 return '';
}
export async function adminText(){ return `🔒 TRINTOPE Control Center\n\nWelcome back, Owner.\n\nManage project content and settings from Telegram.\n\nVersion: ${APP_VERSION}`; }
export async function adminContentText(){ return `📢 Content\n\nNews:\n${await getSetting('news')}\n\nFAQ:\n${await getSetting('faq')}\n\nWelcome:\n${await getSetting('welcome')}`; }
export async function adminProjectText(){ return `🌐 Project\n\nStatus: ${await getSetting('status')}\nWebsite: ${await getSetting('website')}\nX: ${await getSetting('x')}\n\nRoadmap:\n${await getSetting('roadmap')}\n\nTokenomics:\n${await getSetting('tokenomics')}`; }
export async function adminStatsText(){ const s=await stats(); const logs=s.logs.map(l=>`• ${l.action || l.action} ${l.created_at ? new Date(l.created_at).toLocaleString() : l.at || ''}`).join('\n') || 'No logs yet.'; return `📊 Analytics\n\nUsers: ${s.users}\n\nLast actions:\n${logs}`; }
