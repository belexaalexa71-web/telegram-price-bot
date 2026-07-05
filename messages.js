import { store } from '../database/store.js';
import { isOwner } from '../services/security.js';
import { deleteUserCommand } from '../services/cleanup.js';

const map = {
  '/set_website': 'websiteUrl',
  '/set_x': 'xUrl',
  '/set_news': 'news',
  '/set_roadmap': 'roadmap',
  '/set_tokenomics': 'tokenomics',
  '/set_faq': 'faq'
};

export async function textHandler(ctx) {
  store.trackUser(ctx.from);
  const text = ctx.message.text || '';
  const command = Object.keys(map).find(c => text.startsWith(c));
  if (!command) return;
  await deleteUserCommand(ctx);
  if (!isOwner(ctx) || ctx.chat.type !== 'private') return;
  const value = text.slice(command.length).trim();
  if (!value) return ctx.reply('Send text after the command.');
  store.setSetting(map[command], value);
  store.log(ctx.from.id, `${map[command]} updated`);
  const msg = await ctx.reply('✅ Updated successfully.');
  setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 5000);
}
