const { Pool } = require('pg');
const { databaseUrl } = require('../config');

let pool;

function getPool() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Add it in Railway Variables.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function testConnection() {
  const result = await query('SELECT NOW() AS now');
  console.log(`✅ Connected to PostgreSQL at ${result.rows[0].now}`);
}

module.exports = { getPool, query, testConnection };
