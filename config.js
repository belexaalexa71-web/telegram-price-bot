export const BOT_TOKEN = process.env.BOT_TOKEN;
export const OWNER_SETUP_CODE = process.env.OWNER_SETUP_CODE || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const APP_VERSION = '1.0.0-real';
export const WEBSITE_DEFAULT = 'https://ea32b09e.trintope-universe.pages.dev/';
export const X_DEFAULT = 'https://x.com/AndrejK40133234';
export const MENU_TTL_MS = Number(process.env.MENU_TTL_MS || 10 * 60 * 1000);
if (!BOT_TOKEN) throw new Error('BOT_TOKEN is required');
