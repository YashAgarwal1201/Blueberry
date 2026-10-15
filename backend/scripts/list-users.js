const Database = require('better-sqlite3');
const path = require('path');

const rawDbPath = process.env.DATABASE_PATH || (process.env.DATABASE_URL?.startsWith("sqlite:") ? process.env.DATABASE_URL.replace(/^sqlite:\/\//, "") : undefined);
const DB_FILE = rawDbPath ? path.resolve(rawDbPath) : path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(DB_FILE);

const users = db.prepare('SELECT id, email, role FROM user').all();
console.log('Available users:');
console.table(users);
