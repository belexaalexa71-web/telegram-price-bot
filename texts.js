import { store } from '../database/store.js';

export function homeText() {
  const status = store.getSetting('status');
  return `🔷 TRINTOPE\n\nOfficial Project Assistant\n\n🟢 Status: ${status}\n\nChoose an option below.`;
}

export function helpText() {
  return '❓ Help\n\nUse the menu buttons to access official TRINTOPE information.\n\nFor safety, always use official links from this bot.';
}
