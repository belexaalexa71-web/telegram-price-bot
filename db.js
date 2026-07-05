import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

const { Pool } = pg;
const DATA_FILE = path.join(process.cwd(), 'data.json');

const defaults = {
  settings: {
    project_status: 'Building',
    website: 'https://ea32b09e.trintope-universe.pages.dev/',
    x: 'https://x.com/AndrejK40133234',
    welcome: '🚀 Welcome to TRINTOPE\n\nOfficial Project Assistant\n\nChoose an option below.',
    news: 'No announcements yet.',
    roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
    tokenomics: 'Coming soon.',
    faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen launch?\nThe launch date will be announced soon.',
    whitepaper: 'Coming soon.',
  },
  owners: [],
  users: {},
  logs: [],
};

let pool = null;
let jsonDb = null;

function clone(v) { return JSON.parse(JSON.stringify(v)); }

function loadJson() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
  jsonDb = { ...clone(defaults), ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
  jsonDb.settings = { ...clone(defaults.settings), ...(jsonDb.settings || {}) };
  jsonDb.owners = jsonDb.owners || [];
  jsonDb.users = jsonDb.users || {};
  jsonDb.logs = jsonDb.logs || [];
}
function saveJson() { fs.writeFileSync(DATA_FILE, JSON.stringify(jsonDb, null, 2)); }

export async function initDb() {
  if (config.databaseUrl) {
    pool = new Pool({ connectionString: config.databaseUrl, ssl: config.databaseUrl.includes('railway') ? { rejectUnauthorized: false } : undefined });
    await pool.query(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS owners (telegram_id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW());`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (telegram_id TEXT PRIMARY KEY, username TEXT, first_name TEXT, starts INT DEFAULT 0, last_seen TIMESTAMPTZ DEFAULT NOW());`);
    await pool.query(`CREATE TABLE IF NOT EXISTS logs (id SERIAL PRIMARY KEY, telegram_id TEXT, action TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`);
    for (const [key, value] of Object.entries(defaults.settings)) {
      await pool.query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT (key) DO NOTHING', [key, value]);
    }
  } else {
    loadJson();
  }
}

export async function getSetting(key) {
  if (pool) {
    const r = await pool.query('SELECT value FROM settings WHERE key=$1', [key]);
    return r.rows[0]?.value ?? defaults.settings[key] ?? '';
  }
  return jsonDb.settings[key] ?? defaults.settings[key] ?? '';
}
export async function setSetting(key, value) {
  if (pool) await pool.query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value', [key, value]);
  else { jsonDb.settings[key] = value; saveJson(); }
}
export async function allSettings() {
  if (pool) {
    const r = await pool.query('SELECT key,value FROM settings');
    return Object.fromEntries(r.rows.map(x => [x.key, x.value]));
  }
  return { ...jsonDb.settings };
}
export async function isOwner(id) {
  const sid = String(id);
  if (pool) return (await pool.query('SELECT 1 FROM owners WHERE telegram_id=$1', [sid])).rowCount > 0;
  return jsonDb.owners.includes(sid);
}
export async function ownerCount() {
  if (pool) return Number((await pool.query('SELECT COUNT(*) c FROM owners')).rows[0].c);
  return jsonDb.owners.length;
}
export async function addOwner(id) {
  const sid = String(id);
  if (pool) await pool.query('INSERT INTO owners(telegram_id) VALUES($1) ON CONFLICT DO NOTHING', [sid]);
  else if (!jsonDb.owners.includes(sid)) { jsonDb.owners.push(sid); saveJson(); }
}
export async function trackUser(user) {
  const id = String(user.id);
  if (pool) await pool.query(`INSERT INTO users(telegram_id,username,first_name,starts,last_seen) VALUES($1,$2,$3,1,NOW()) ON CONFLICT(telegram_id) DO UPDATE SET username=$2, first_name=$3, starts=users.starts+1, last_seen=NOW()`, [id, user.username || '', user.first_name || '']);
  else { const u = jsonDb.users[id] || { starts: 0 }; jsonDb.users[id] = { username: user.username || '', first_name: user.first_name || '', starts: u.starts + 1, last_seen: new Date().toISOString() }; saveJson(); }
}
export async function stats() {
  if (pool) {
    const users = Number((await pool.query('SELECT COUNT(*) c FROM users')).rows[0].c);
    const starts = Number((await pool.query('SELECT COALESCE(SUM(starts),0) c FROM users')).rows[0].c);
    return { users, starts };
  }
  const users = Object.values(jsonDb.users);
  return { users: users.length, starts: users.reduce((a,u)=>a+(u.starts||0),0) };
}
export async function logAction(id, action) {
  if (pool) await pool.query('INSERT INTO logs(telegram_id,action) VALUES($1,$2)', [String(id), action]);
  else { jsonDb.logs.unshift({ id: String(id), action, at: new Date().toISOString() }); jsonDb.logs = jsonDb.logs.slice(0,50); saveJson(); }
}
export async function recentLogs(limit=10) {
  if (pool) return (await pool.query('SELECT telegram_id,action,created_at FROM logs ORDER BY id DESC LIMIT $1', [limit])).rows;
  return jsonDb.logs.slice(0, limit).map(x => ({ telegram_id:x.id, action:x.action, created_at:x.at }));
}
