async function editOrReply(ctx, text, keyboard) {
  try {
    if (ctx.callbackQuery) {
      return await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
    }
    return await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

async function safeDelete(ctx) {
  try {
    if (ctx.message) await ctx.deleteMessage(ctx.message.message_id);
  } catch (_) {}
}

module.exports = { editOrReply, safeDelete };
