const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied successfully');
  await pool.end();
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
