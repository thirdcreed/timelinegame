#!/usr/bin/env node
// Run database migrations

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    try {
        console.log('Running migrations...');

        // Get all migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            console.log(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await pool.query(sql);
            console.log(`  Completed: ${file}`);
        }

        console.log('All migrations completed successfully!');
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
