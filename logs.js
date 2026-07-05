const { query } = require('./connection');

async function addLog(ctx, action, details = '') {
  const actorId = String(ctx.from?.id || 'unknown');
  await query('INSERT INTO admin_logs (actor_id, action, details) VALUES ($1, $2, $3)', [actorId, action, details]);
}

async function recentLogs(limit = 10) {
  const result = await query(
    'SELECT action, details, created_at FROM admin_logs ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

module.exports = { addLog, recentLogs };
