import { Markup } from 'telegraf';

export const btn = (text, data) => Markup.button.callback(text, data);
export const url = (text, href) => Markup.button.url(text, href);

export function nav(rows, back='home') {
  return Markup.inlineKeyboard([
    ...rows,
    [btn('⬅ Back', back), btn('❌ Close', 'close')]
  ]);
}
