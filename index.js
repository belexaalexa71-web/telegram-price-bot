const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
const DATA_FILE = './data.json';
const BOT_USERNAME = process.env.BOT_USERNAME || '';

const defaultData = {
  status: 'Building',
  website: 'https://ea32b09e.trintope-universe.pages.dev/',
  x: 'https://x.com/AndrejK40133234',
  news: 'No announcements yet. Follow X for updates.',
  roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
  tokenomics: 'Coming soon. Tokenomics will be published before launch.',
  faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen launch?\nThe launch date will be announced soon.',
  users: {}
};

function loadData(){
  try { if (fs.existsSync(DATA_FILE)) return {...defaultData, ...JSON.parse(fs.readFileSync(DATA_FILE,'utf8'))}; } catch(e) {}
  return {...defaultData};
}
function saveData(){ fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2)); }
let data = loadData();

function isAdmin(ctx){ return ADMIN_IDS.includes(String(ctx.from?.id)); }
function isPrivate(ctx){ return ctx.chat?.type === 'private'; }
function remember(ctx){ if(ctx.from){ data.users[String(ctx.from.id)] = {username:ctx.from.username||'', first_name:ctx.from.first_name||'', last_seen:new Date().toISOString()}; saveData(); }}

async function safeDelete(ctx, msgId){ try { await ctx.telegram.deleteMessage(ctx.chat.id, msgId); } catch(e) {} }
async function cleanGroup(ctx){
  if(ctx.message?.message_id) await safeDelete(ctx, ctx.message.message_id);
  const url = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : undefined;
  const kb = url ? Markup.inlineKeyboard([[Markup.button.url('🔒 Open TRINTOPE Bot', url)]]) : undefined;
  const m = await ctx.reply('🔒 Use the official TRINTOPE bot in private chat.', kb).catch(()=>null);
  if(m) setTimeout(()=>safeDelete(ctx, m.message_id), 8000);
}

function homeKb(ctx){
 const rows = [
  [Markup.button.callback('📊 Market','market'), Markup.button.callback('📚 Project','project')],
  [Markup.button.callback('🌍 Community','community'), Markup.button.callback('❓ FAQ','faq')],
  [Markup.button.callback('❌ Close','close')]
 ];
 if(isAdmin(ctx)) rows.splice(2,0,[Markup.button.callback('🔒 Admin Panel','admin')]);
 return Markup.inlineKeyboard(rows);
}
function backKb(back='home'){ return Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', back), Markup.button.callback('❌ Close','close')]]); }
function textHome(){ return `🚀 TRINTOPE\n\nOfficial Project Bot\n\n🟢 Status: ${data.status}\n\nChoose an option below.`; }
async function editOrReply(ctx, text, kb){
 try { if(ctx.callbackQuery) return await ctx.editMessageText(text, kb); } catch(e) {}
 return ctx.reply(text, kb);
}

bot.start(async ctx => { remember(ctx); if(!isPrivate(ctx)) return cleanGroup(ctx); return ctx.reply(textHome(), homeKb(ctx)); });
bot.command('help', async ctx => { remember(ctx); if(!isPrivate(ctx)) return cleanGroup(ctx); return ctx.reply('Use /start to open the TRINTOPE menu.'); });
bot.command('id', async ctx => ctx.reply(`Your Telegram ID: ${ctx.from.id}`));
bot.on('message', async (ctx,next) => { remember(ctx); if(!isPrivate(ctx) && ctx.message?.text?.startsWith('/')) return cleanGroup(ctx); return next(); });

bot.action('home', async ctx => { remember(ctx); await ctx.answerCbQuery(); return editOrReply(ctx, textHome(), homeKb(ctx)); });
bot.action('market', async ctx => { await ctx.answerCbQuery(); return editOrReply(ctx, '📊 Market\n\n💰 Price: Token is not live yet.\n📈 Chart: Available after launch.\n🛒 Buy: Trading is not available yet.', backKb()); });
bot.action('project', async ctx => { await ctx.answerCbQuery(); return editOrReply(ctx, `📚 Project\n\n📢 News:\n${data.news}\n\n🗺 Roadmap:\n${data.roadmap}\n\n💎 Tokenomics:\n${data.tokenomics}`, backKb()); });
bot.action('community', async ctx => { await ctx.answerCbQuery(); return editOrReply(ctx, `🌍 Community\n\n🌐 Website:\n${data.website}\n\n🐦 X:\n${data.x}\n\nAlways use only official links.`, backKb()); });
bot.action('faq', async ctx => { await ctx.answerCbQuery(); return editOrReply(ctx, `❓ FAQ\n\n${data.faq}`, backKb()); });
bot.action('close', async ctx => { await ctx.answerCbQuery(); try { await ctx.deleteMessage(); } catch(e) {} });

function adminKb(){ return Markup.inlineKeyboard([
 [Markup.button.callback('🟢 Status','admin_status'), Markup.button.callback('🔗 Links','admin_links')],
 [Markup.button.callback('📢 News','admin_edit_news'), Markup.button.callback('🗺 Roadmap','admin_edit_roadmap')],
 [Markup.button.callback('💎 Tokenomics','admin_edit_tokenomics'), Markup.button.callback('❓ FAQ','admin_edit_faq')],
 [Markup.button.callback('📊 Stats','admin_stats')],
 [Markup.button.callback('⬅️ Back','home'), Markup.button.callback('❌ Close','close')]
]);}
bot.action('admin', async ctx => { await ctx.answerCbQuery(); if(!isPrivate(ctx)||!isAdmin(ctx)) return; return editOrReply(ctx,'🔒 Admin Panel\n\nOnly authorized admins can see this panel.',adminKb()); });
bot.action('admin_stats', async ctx => { await ctx.answerCbQuery(); if(!isPrivate(ctx)||!isAdmin(ctx)) return; return editOrReply(ctx,`📊 Stats\n\nUsers: ${Object.keys(data.users||{}).length}\nStatus: ${data.status}`,adminKb()); });
bot.action('admin_status', async ctx => { await ctx.answerCbQuery(); if(!isPrivate(ctx)||!isAdmin(ctx)) return; return editOrReply(ctx,'Choose project status:',Markup.inlineKeyboard([
 [Markup.button.callback('🟢 Building','set_status:Building'), Markup.button.callback('🟡 Presale','set_status:Presale')],
 [Markup.button.callback('🚀 Live','set_status:Live')],
 [Markup.button.callback('⬅️ Back','admin')]
])); });
bot.action(/set_status:(.+)/, async ctx => { await ctx.answerCbQuery('Status updated'); if(!isPrivate(ctx)||!isAdmin(ctx)) return; data.status = ctx.match[1]; saveData(); return editOrReply(ctx,`✅ Status updated: ${data.status}`,adminKb()); });
bot.action('admin_links', async ctx => { await ctx.answerCbQuery(); if(!isPrivate(ctx)||!isAdmin(ctx)) return; return editOrReply(ctx,`🔗 Current Links\n\nWebsite:\n${data.website}\n\nX:\n${data.x}\n\nTo edit, send:\n/setwebsite https://...\n/setx https://x.com/...`,adminKb()); });

const editMap = {admin_edit_news:['news','/setnews'], admin_edit_roadmap:['roadmap','/setroadmap'], admin_edit_tokenomics:['tokenomics','/settokenomics'], admin_edit_faq:['faq','/setfaq']};
for(const [action,[field,cmd]] of Object.entries(editMap)) bot.action(action, async ctx=>{ await ctx.answerCbQuery(); if(!isPrivate(ctx)||!isAdmin(ctx)) return; return editOrReply(ctx,`Current ${field}:\n\n${data[field]}\n\nTo edit, send:\n${cmd} new text`,adminKb()); });
function adminSetCommand(cmd, field){ bot.command(cmd, async ctx=>{ if(!isPrivate(ctx)||!isAdmin(ctx)) return; const txt = ctx.message.text.replace('/'+cmd,'').trim(); if(!txt) return ctx.reply(`Send: /${cmd} new text`); data[field]=txt; saveData(); return ctx.reply(`✅ ${field} updated.`); }); }
adminSetCommand('setnews','news'); adminSetCommand('setroadmap','roadmap'); adminSetCommand('settokenomics','tokenomics'); adminSetCommand('setfaq','faq');
bot.command('setwebsite', async ctx=>{ if(!isPrivate(ctx)||!isAdmin(ctx)) return; const txt=ctx.message.text.replace('/setwebsite','').trim(); if(!txt) return ctx.reply('Send: /setwebsite https://...'); data.website=txt; saveData(); ctx.reply('✅ Website updated.'); });
bot.command('setx', async ctx=>{ if(!isPrivate(ctx)||!isAdmin(ctx)) return; const txt=ctx.message.text.replace('/setx','').trim(); if(!txt) return ctx.reply('Send: /setx https://x.com/...'); data.x=txt; saveData(); ctx.reply('✅ X updated.'); });

bot.catch((err)=>console.error('Bot error:',err));
bot.launch();
console.log('TRINTOPE Bot started');
process.once('SIGINT',()=>bot.stop('SIGINT')); process.once('SIGTERM',()=>bot.stop('SIGTERM'));
