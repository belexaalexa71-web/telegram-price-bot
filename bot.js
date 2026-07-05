import { Telegraf, Markup } from 'telegraf';
import { BOT_TOKEN, OWNER_SETUP_CODE, MENU_TTL_MS } from './config.js';
import { initDb, getSetting, setSetting, trackUser, logAction } from './database/db.js';
import { mainKb, navKb, adminKb, editKb, statusKb } from './keyboards/main.js';
import { homeText, screen, isOwner, adminText, adminContentText, adminProjectText, adminStatsText } from './services/render.js';

const bot = new Telegraf(BOT_TOKEN);
const sessions = new Map();
const editState = new Map();

async function safeDelete(ctx, messageId=ctx.message?.message_id){ try{ if(messageId) await ctx.deleteMessage(messageId); }catch{} }
function scheduleDelete(ctx, chatId, msgId){ const key=`${chatId}:${msgId}`; clearTimeout(sessions.get(key)); sessions.set(key,setTimeout(async()=>{ try{ await ctx.telegram.deleteMessage(chatId,msgId);}catch{} sessions.delete(key); }, MENU_TTL_MS)); }
async function sendOrEdit(ctx, text, keyboard){
 const chatId = ctx.chat?.id || ctx.callbackQuery?.message?.chat?.id;
 if(ctx.callbackQuery?.message){ await ctx.editMessageText(text,{reply_markup:keyboard}); scheduleDelete(ctx, chatId, ctx.callbackQuery.message.message_id); }
 else { const m=await ctx.reply(text,{reply_markup:keyboard}); scheduleDelete(ctx, chatId, m.message_id); }
}
async function openHome(ctx){ await trackUser(ctx.from); await sendOrEdit(ctx, await homeText(), mainKb(await isOwner(ctx))); }
async function groupRedirect(ctx){ await safeDelete(ctx); const username=ctx.botInfo?.username; const msg=await ctx.reply('🔒 Open the official TRINTOPE bot in private chat.', Markup.inlineKeyboard([[Markup.button.url('Open TRINTOPE Bot',`https://t.me/${username}`)]])).catch(()=>null); if(msg) setTimeout(()=>ctx.telegram.deleteMessage(ctx.chat.id,msg.message_id).catch(()=>{}),8000); }

bot.start(async ctx=>{ if(ctx.chat.type!=='private') return groupRedirect(ctx); await safeDelete(ctx); await openHome(ctx); });
bot.command('help', async ctx=>{ if(ctx.chat.type!=='private') return groupRedirect(ctx); await safeDelete(ctx); await sendOrEdit(ctx, await screen('help'), navKb.inline_keyboard); });
bot.command('id', async ctx=>{ await safeDelete(ctx); if(ctx.chat.type==='private'){ const m=await ctx.reply(`Your Telegram ID: ${ctx.from.id}`); setTimeout(()=>ctx.telegram.deleteMessage(ctx.chat.id,m.message_id).catch(()=>{}),10000);} });
bot.command('setup_owner', async ctx=>{ if(ctx.chat.type!=='private') return groupRedirect(ctx); await safeDelete(ctx); const current=await getSetting('owner_id'); if(current) return ctx.reply('Owner already configured.').then(m=>setTimeout(()=>ctx.telegram.deleteMessage(ctx.chat.id,m.message_id).catch(()=>{}),8000)); const code=ctx.message.text.split(' ').slice(1).join(' ').trim(); if(!OWNER_SETUP_CODE || code!==OWNER_SETUP_CODE) return ctx.reply('Invalid setup code.').then(m=>setTimeout(()=>ctx.telegram.deleteMessage(ctx.chat.id,m.message_id).catch(()=>{}),8000)); await setSetting('owner_id', String(ctx.from.id), ctx.from.id); await logAction(ctx.from.id,'owner configured'); await ctx.reply('✅ Owner configured. Open /start again.'); });

bot.on('message', async ctx=>{
 if(ctx.chat.type!=='private') return;
 const state=editState.get(ctx.from.id);
 if(!state) return;
 await safeDelete(ctx);
 await setSetting(state.key, ctx.message.text || '', ctx.from.id);
 editState.delete(ctx.from.id);
 const m=await ctx.reply(`✅ Updated: ${state.label}`); setTimeout(()=>ctx.telegram.deleteMessage(ctx.chat.id,m.message_id).catch(()=>{}),3000);
 await openHome(ctx);
});

bot.action('close', async ctx=>{ await ctx.answerCbQuery(); try{ await ctx.deleteMessage(); }catch{} });
bot.action('home', async ctx=>{ await ctx.answerCbQuery(); await openHome(ctx); });
for(const name of ['market','project','community','help']) bot.action(name, async ctx=>{ await ctx.answerCbQuery(); await sendOrEdit(ctx, await screen(name), navKb.inline_keyboard); });
bot.action('admin', async ctx=>{ await ctx.answerCbQuery(); if(!await isOwner(ctx)) return; await sendOrEdit(ctx, await adminText(), adminKb().inline_keyboard); });
bot.action('admin_content', async ctx=>{ await ctx.answerCbQuery(); if(!await isOwner(ctx)) return; await sendOrEdit(ctx, await adminContentText(), {inline_keyboard:[[ {text:'✏️ News',callback_data:'edit_news'}, {text:'✏️ FAQ',callback_data:'edit_faq'}],[{text:'✏️ Welcome',callback_data:'edit_welcome'}],[{text:'⬅️ Back',callback_data:'admin'}]]}); });
bot.action('admin_project', async ctx=>{ await ctx.answerCbQuery(); if(!await isOwner(ctx)) return; await sendOrEdit(ctx, await adminProjectText(), {inline_keyboard:[[ {text:'🟢 Status',callback_data:'status_menu'}],[{text:'✏️ Website',callback_data:'edit_website'}, {text:'✏️ X',callback_data:'edit_x'}],[{text:'✏️ Roadmap',callback_data:'edit_roadmap'}, {text:'✏️ Tokenomics',callback_data:'edit_tokenomics'}],[{text:'⬅️ Back',callback_data:'admin'}]]}); });
bot.action('admin_stats', async ctx=>{ await ctx.answerCbQuery(); if(!await isOwner(ctx)) return; await sendOrEdit(ctx, await adminStatsText(), {inline_keyboard:[[ {text:'⬅️ Back',callback_data:'admin'}]]}); });
bot.action('admin_system', async ctx=>{ await ctx.answerCbQuery(); if(!await isOwner(ctx)) return; await sendOrEdit(ctx, '⚙️ System\n\n✅ Clean UI enabled\n✅ Private menu enabled\n✅ Owner protection enabled\n✅ Database / JSON storage enabled', {inline_keyboard:[[ {text:'⬅️ Back',callback_data:'admin'}]]}); });
bot.action('status_menu', async ctx=>{ await ctx.answerCbQuery(); if(!await isOwner(ctx)) return; await sendOrEdit(ctx,'🟢 Choose project status:', statusKb().inline_keyboard); });
bot.action(/^set_status:(.+)$/, async ctx=>{ await ctx.answerCbQuery(); if(!await isOwner(ctx)) return; await setSetting('status', ctx.match[1], ctx.from.id); await sendOrEdit(ctx, `✅ Status updated: ${ctx.match[1]}`, {inline_keyboard:[[ {text:'⬅️ Back',callback_data:'admin_project'}]]}); });
const labels={news:'News',faq:'FAQ',welcome:'Welcome text',website:'Website',x:'X link',roadmap:'Roadmap',tokenomics:'Tokenomics'};
bot.action(/^edit_(.+)$/, async ctx=>{ await ctx.answerCbQuery(); if(!await isOwner(ctx)) return; const key=ctx.match[1]; editState.set(ctx.from.id,{key,label:labels[key]||key}); await sendOrEdit(ctx, `✏️ Send new value for: ${labels[key]||key}\n\nYour next message will be saved.`, {inline_keyboard:[[ {text:'Cancel',callback_data:'admin'}]]}); });

bot.catch((err)=>console.error('Bot error',err));
await initDb();
bot.launch();
console.log('TRINTOPE bot started');
process.once('SIGINT',()=>bot.stop('SIGINT'));
process.once('SIGTERM',()=>bot.stop('SIGTERM'));
