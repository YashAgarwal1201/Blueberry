// src/db.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_FILE = path.resolve(process.cwd(), "data", "app.db");

// ensure folder exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// open (this creates the file if not exists)
const db = new Database(DB_FILE);

// run a simple migration to create table if missing
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT ''
  );
`);

export default db;
