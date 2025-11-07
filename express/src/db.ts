// src/db.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_FILE = path.resolve(process.cwd(), "data", "app.db");

// ensure folder exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// this creates the file if not exists
const db = new Database(DB_FILE);

// Enable foreign keys (important for relational integrity!)
db.pragma("foreign_keys = ON");

// Run migrations to create tables if missing
db.exec(`
  -- Movies table (core information)
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    release_year INTEGER,
    director TEXT,
    poster_url TEXT,
    runtime INTEGER,  -- in minutes
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Languages table (master list of languages)
  CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,  -- e.g., "English", "Hindi", "Spanish"
    code TEXT NOT NULL UNIQUE   -- e.g., "en", "hi", "es" (ISO 639-1)
  );

  -- Movie-Languages junction table (many-to-many)
  CREATE TABLE IF NOT EXISTS movie_languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(movie_id, language_id)  -- prevent duplicate entries
  );

  -- Watchlist table
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('want_to_watch', 'watching', 'watched')),
    added_at TEXT DEFAULT (datetime('now')),
    watched_at TEXT,  -- timestamp when marked as watched
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    UNIQUE(movie_id)  -- one movie can only appear once in watchlist
  );

  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_movie_languages_movie_id ON movie_languages(movie_id);
  CREATE INDEX IF NOT EXISTS idx_movie_languages_language_id ON movie_languages(language_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_movie_id ON watchlist(movie_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status);

  -- Insert some default languages
  INSERT OR IGNORE INTO languages (name, code) VALUES 
    ('English', 'en'),
    ('Hindi', 'hi'),
    ('Spanish', 'es'),
    ('French', 'fr'),
    ('German', 'de'),
    ('Japanese', 'ja'),
    ('Korean', 'ko'),
    ('Mandarin', 'zh'),
    ('Tamil', 'ta'),
    ('Telugu', 'te');
`);

console.log(
  "Database initialized with tables: movies, languages, movie_languages, watchlist"
);

export default db;
