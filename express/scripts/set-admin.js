const Database = require('better-sqlite3');
const path = require('path');

const email = process.argv[2];
if (!email) {
  console.error("Please provide an email address. Example: node set-admin.js user@example.com");
  process.exit(1);
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(DB_FILE);

const result = db.prepare("UPDATE user SET role = 'admin' WHERE email = ?").run(email);

if (result.changes > 0) {
  console.log(`Successfully promoted ${email} to admin!`);
} else {
  console.error(`User with email ${email} not found.`);
}
