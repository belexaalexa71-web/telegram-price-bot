const { query } = require('./connection');

function toUser(ctx) {
  const from = ctx.from || {};
  return {
    telegramId: String(from.id),
    username: from.username || '',
    firstName: from.first_name || '',
  };
}

async function upsertUser(ctx) {
  if (!ctx.from) return;
  const user = toUser(ctx);
  await query(
    `INSERT INTO users (telegram_id, username, first_name, last_seen, launches)
     VALUES ($1, $2, $3, NOW(), 1)
     ON CONFLICT (telegram_id) DO UPDATE SET
       username = EXCLUDED.username,
       first_name = EXCLUDED.first_name,
       last_seen = NOW(),
       launches = users.launches + 1`,
    [user.telegramId, user.username, user.firstName]
  );
}

async function getStats() {
  const total = await query('SELECT COUNT(*)::int AS count FROM users');
  const today = await query("SELECT COUNT(*)::int AS count FROM users WHERE first_seen >= date_trunc('day', NOW())");
  const launches = await query('SELECT COALESCE(SUM(launches), 0)::int AS count FROM users');
  return { total: total.rows[0].count, today: today.rows[0].count, launches: launches.rows[0].count };
}

module.exports = { upsertUser, getStats };
