'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  try {
    // Ensure tracking table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT        PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await pool.query('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map(r => r.filename));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }
      await pool.query(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      console.log(`Applied ${file}`);
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
