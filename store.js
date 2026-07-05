import fs from 'fs';
import path from 'path';
const file = path.resolve('data.json');
const defaults = {
  ownerId: null,
  users: {},
  settings: { status: 'Building', website: 'https://ea32b09e.trintope-universe.pages.dev/', xUrl: 'https://x.com/AndrejK40133234', welcome: 'Welcome to the official TRINTOPE assistant.' },
  news: 'No announcements yet.',
  roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
  tokenomics: 'Tokenomics will be published before launch.',
  faq: 'Q: What is TRINTOPE?\nA: A community-driven Web3 project.\n\nQ: When launch?\nA: Soon. Official date will be announced.',
  logs: []
};
function load(){ try { return { ...defaults, ...JSON.parse(fs.readFileSync(file,'utf8')) }; } catch { return structuredClone(defaults); } }
function save(data){ fs.writeFileSync(file, JSON.stringify(data,null,2)); }
export const store = {
  get(){ return load(); },
  set(mutator){ const data = load(); mutator(data); save(data); return data; },
  log(userId, action){ this.set(d => d.logs.unshift({ at: new Date().toISOString(), userId, action })); }
};
