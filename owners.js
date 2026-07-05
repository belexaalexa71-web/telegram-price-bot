const { query } = require('./connection');
const { adminIds } = require('../config');

async function isOwner(ctx) {
  const id = String(ctx.from?.id || '');
  if (!id) return false;
  if (adminIds.includes(id)) return true;
  const result = await query('SELECT 1 FROM owners WHERE telegram_id = $1', [id]);
  return result.rowCount > 0;
}

async function ownerExists() {
  const result = await query('SELECT COUNT(*)::int AS count FROM owners');
  return result.rows[0].count > 0 || adminIds.length > 0;
}

async function addOwner(ctx) {
  const from = ctx.from || {};
  await query(
    `INSERT INTO owners (telegram_id, username)
     VALUES ($1, $2)
     ON CONFLICT (telegram_id) DO NOTHING`,
    [String(from.id), from.username || '']
  );
}

module.exports = { isOwner, ownerExists, addOwner };
