import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { DATABASE_URL, WEBSITE_DEFAULT, X_DEFAULT } from '../config.js';

const jsonPath = path.join(process.cwd(), 'data.json');
let pool = null;
if (DATABASE_URL) pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const defaults = {
  owner_id: '', status: 'Building', website: WEBSITE_DEFAULT, x: X_DEFAULT,
  news: 'No announcements yet.', roadmap: '✅ Website\n✅ Telegram Bot\n🔄 Community\n⬜ Token Launch\n⬜ DEX Listing\n⬜ Marketing',
  tokenomics: 'Tokenomics will be published before launch.', faq: 'What is TRINTOPE?\nA community-driven Web3 project.\n\nWhen launch?\nThe launch date will be announced soon.', welcome: 'Welcome to the official TRINTOPE assistant.'
};

function readJson(){ if(!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify({settings: defaults, users:{}, logs:[]}, null, 2)); return JSON.parse(fs.readFileSync(jsonPath,'utf8')); }
function writeJson(d){ fs.writeFileSync(jsonPath, JSON.stringify(d,null,2)); }

export async function initDb(){
 if(pool){
  await pool.query(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT, first_name TEXT, last_seen TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS logs(id SERIAL PRIMARY KEY, actor_id TEXT, action TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`);
  for(const [k,v] of Object.entries(defaults)) await pool.query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT DO NOTHING',[k,String(v)]);
 } else readJson();
}
export async function getSetting(key){ if(pool){ const r=await pool.query('SELECT value FROM settings WHERE key=$1',[key]); return r.rows[0]?.value ?? defaults[key] ?? ''; } const d=readJson(); return d.settings[key] ?? defaults[key] ?? ''; }
export async function setSetting(key,value, actor='system'){ if(pool){ await pool.query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2',[key,String(value)]); await logAction(actor,`set ${key}`); return;} const d=readJson(); d.settings[key]=String(value); d.logs.push({actor, action:`set ${key}`, at:new Date().toISOString()}); writeJson(d); }
export async function trackUser(user){ if(!user) return; const id=String(user.id); if(pool){ await pool.query('INSERT INTO users(id,username,first_name,last_seen) VALUES($1,$2,$3,NOW()) ON CONFLICT(id) DO UPDATE SET username=$2, first_name=$3, last_seen=NOW()',[id,user.username||'',user.first_name||'']); return;} const d=readJson(); d.users[id]={username:user.username||'', first_name:user.first_name||'', last_seen:new Date().toISOString()}; writeJson(d); }
export async function stats(){ if(pool){ const u=await pool.query('SELECT COUNT(*)::int AS c FROM users'); const l=await pool.query('SELECT action,created_at FROM logs ORDER BY id DESC LIMIT 5'); return {users:u.rows[0].c, logs:l.rows}; } const d=readJson(); return {users:Object.keys(d.users).length, logs:d.logs.slice(-5).reverse()}; }
export async function logAction(actor, action){ if(pool) await pool.query('INSERT INTO logs(actor_id,action) VALUES($1,$2)',[String(actor),action]); else { const d=readJson(); d.logs.push({actor:String(actor),action,at:new Date().toISOString()}); writeJson(d); } }
