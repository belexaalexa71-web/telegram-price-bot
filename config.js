import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN,
  ownerSetupCode: process.env.OWNER_SETUP_CODE || '',
  websiteUrl: process.env.WEBSITE_URL || 'https://ea32b09e.trintope-universe.pages.dev/',
  xUrl: process.env.X_URL || 'https://x.com/AndrejK40133234',
  menuTtlMs: Number(process.env.MENU_TTL_MS || 10 * 60 * 1000),
};

if (!config.botToken) {
  throw new Error('BOT_TOKEN is required');
}
