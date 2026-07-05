import { nav } from '../keyboards/navigation.js';
import { homeText, helpText } from '../keyboards/texts.js';
import { store } from '../database/store.js';
import { isOwner } from '../services/security.js';
import { handleAdminCallback } from '../admin/router.js';

async function edit(ctx, text, keyboard) {
  await ctx.editMessageText(text, { reply_markup: keyboard }).catch(async () => {
    await ctx.reply(text, { reply_markup: keyboard });
  });
}

export async function callbackHandler(ctx) {
  const data = ctx.callbackQuery.data;
  store.trackUser(ctx.from);
  await ctx.answerCbQuery().catch(() => {});

  if (data === 'close') return ctx.deleteMessage().catch(() => {});
  if (data === 'home') return edit(ctx, homeText(), nav.main(isOwner(ctx)));

  if (data === 'market') return edit(ctx, '📊 Market\n\nToken data will become available after launch.', nav.market());
  if (data === 'price') return edit(ctx, '💰 Price\n\nToken is not live yet.', nav.market());
  if (data === 'chart') return edit(ctx, '📈 Chart\n\nChart will be available after launch.', nav.market());
  if (data === 'buy') return edit(ctx, '🛒 Buy\n\nTrading is not available yet.', nav.market());
  if (data === 'community') return edit(ctx, '🌍 Community\n\nUse only official TRINTOPE links.', nav.community(store.getSetting('websiteUrl'), store.getSetting('xUrl')));
  if (data === 'project') return edit(ctx, '📚 Project\n\nChoose a project section.', nav.project());
  if (data === 'news') return edit(ctx, `📢 News\n\n${store.getSetting('news')}`, nav.project());
  if (data === 'roadmap') return edit(ctx, `🗺 Roadmap\n\n${store.getSetting('roadmap')}`, nav.project());
  if (data === 'tokenomics') return edit(ctx, `💎 Tokenomics\n\n${store.getSetting('tokenomics')}`, nav.project());
  if (data === 'faq') return edit(ctx, `❓ FAQ\n\n${store.getSetting('faq')}`, nav.project());
  if (data === 'help') return edit(ctx, helpText(), nav.main(isOwner(ctx)));

  if (data.startsWith('admin') || data.startsWith('set_status')) {
    return handleAdminCallback(ctx, edit);
  }
}
