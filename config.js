export const config = {
  botToken: process.env.BOT_TOKEN,
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ownerSetupCode: process.env.OWNER_SETUP_CODE,
  publicBotUsername: process.env.BOT_USERNAME || '',
  menuTtlMs: Number(process.env.MENU_TTL_MS || 10 * 60 * 1000),
  version: 'TRINTOPE DB Core v1.0.0',
};

export function requireConfig() {
  if (!config.botToken) throw new Error('BOT_TOKEN is required');
}
