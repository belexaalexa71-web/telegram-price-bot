function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseIds(value = '') {
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

module.exports = {
  botToken: required('BOT_TOKEN'),
  databaseUrl: process.env.DATABASE_URL || '',
  ownerSetupCode: process.env.OWNER_SETUP_CODE || '',
  adminIds: parseIds(process.env.ADMIN_IDS || ''),
  menuTtlMs: Number(process.env.MENU_TTL_MS || 10 * 60 * 1000),
};
