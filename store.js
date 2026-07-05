import fs from 'node:fs';
import path from 'node:path';

const dataPath = path.resolve(process.cwd(), 'data.json');

const defaultData = {
  ownerId: null,
  users: {},
  settings: {
    status: 'Building',
    websiteUrl: 'https://ea32b09e.trintope-universe.pages.dev/',
    xUrl: 'https://x.com/AndrejK40133234',
    news: 'No announcements yet.',
    roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
    tokenomics: 'Coming soon.',
    faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen launch?\nLaunch date will be announced soon.'
  },
  logs: []
};

function load() {
  if (!fs.existsSync(dataPath)) return structuredClone(defaultData);
  try {
    return { ...structuredClone(defaultData), ...JSON.parse(fs.readFileSync(dataPath, 'utf8')) };
  } catch {
    return structuredClone(defaultData);
  }
}

let data = load();

function save() {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

export const store = {
  getData: () => data,
  getOwnerId: () => data.ownerId,
  setOwnerId: (id) => { data.ownerId = String(id); save(); },
  isOwner: (id) => String(id) === String(data.ownerId),
  trackUser: (user) => {
    if (!user?.id) return;
    data.users[user.id] = { id: user.id, username: user.username || '', firstName: user.first_name || '', lastSeen: new Date().toISOString() };
    save();
  },
  getSetting: (key) => data.settings[key],
  setSetting: (key, value) => { data.settings[key] = value; save(); },
  stats: () => ({ users: Object.keys(data.users).length, logs: data.logs.length, status: data.settings.status }),
  log: (actorId, action) => { data.logs.unshift({ at: new Date().toISOString(), actorId, action }); data.logs = data.logs.slice(0, 50); save(); },
  logs: () => data.logs.slice(0, 10)
};
