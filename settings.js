const { query } = require('./connection');

async function getSetting(key) {
  const result = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return result.rows[0]?.value || '';
}

async function setSetting(key, value) {
  await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

async function getSettingsMap() {
  const result = await query('SELECT key, value FROM settings');
  return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
}

module.exports = { getSetting, setSetting, getSettingsMap };
