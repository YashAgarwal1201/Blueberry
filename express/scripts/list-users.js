const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(DB_FILE);

const users = db.prepare('SELECT id, email, role FROM user').all();
console.log('Available users:');
console.table(users);
