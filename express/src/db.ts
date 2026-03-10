// src/db.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_FILE = path.resolve(process.cwd(), "data", "app.db");
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_FILE);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// Helper: safely add a column if it doesn't already exist (SQLite has no IF NOT EXISTS for ALTER)
function addColumnIfMissing(table: string, column: string, definition: string) {
  const cols = db.pragma(`table_info(${table})`) as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// ── Core tables ─────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    description  TEXT    DEFAULT '',
    release_year INTEGER,
    director     TEXT,
    poster_url   TEXT,
    runtime      INTEGER,
    created_at   TEXT    DEFAULT (datetime('now')),
    updated_at   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS languages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL UNIQUE,
    code         TEXT NOT NULL UNIQUE,
    native_script TEXT
  );

  CREATE TABLE IF NOT EXISTS movie_languages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id    INTEGER NOT NULL REFERENCES movies(id)    ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(movie_id, language_id)
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id   INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    status     TEXT    NOT NULL CHECK(status IN ('want_to_watch','watching','watched')),
    added_at   TEXT    DEFAULT (datetime('now')),
    watched_at TEXT,
    notes      TEXT,
    UNIQUE(movie_id)
  );

  -- ── Genres ────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS genres (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS movie_genres (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL REFERENCES movies(id)  ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(id)  ON DELETE CASCADE,
    UNIQUE(movie_id, genre_id)
  );

  -- ── People (cast & crew) ──────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS people (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    also_known_as TEXT,
    bio         TEXT,
    birth_date  TEXT,
    birth_place TEXT,
    profile_url TEXT,
    tmdb_id     INTEGER UNIQUE,
    imdb_id     TEXT UNIQUE,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS movie_cast (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id      INTEGER NOT NULL REFERENCES movies(id)  ON DELETE CASCADE,
    person_id     INTEGER NOT NULL REFERENCES people(id)  ON DELETE CASCADE,
    role          TEXT NOT NULL DEFAULT 'actor'
                  CHECK(role IN ('actor','director','writer','producer',
                                 'cinematographer','composer','editor')),
    character     TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(movie_id, person_id, role)
  );

  -- ── Companies ─────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS companies (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL UNIQUE,
    type     TEXT NOT NULL DEFAULT 'production'
             CHECK(type IN ('production','distribution','streaming')),
    logo_url TEXT,
    country  TEXT,
    tmdb_id  INTEGER UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS movie_companies (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id   INTEGER NOT NULL REFERENCES movies(id)   ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role       TEXT NOT NULL DEFAULT 'production'
               CHECK(role IN ('production','distribution','streaming')),
    UNIQUE(movie_id, company_id, role)
  );

  -- ── Indexes ───────────────────────────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_movie_languages_movie     ON movie_languages(movie_id);
  CREATE INDEX IF NOT EXISTS idx_movie_languages_language  ON movie_languages(language_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_movie           ON watchlist(movie_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_status          ON watchlist(status);
  CREATE INDEX IF NOT EXISTS idx_movie_genres_movie        ON movie_genres(movie_id);
  CREATE INDEX IF NOT EXISTS idx_movie_genres_genre        ON movie_genres(genre_id);
  CREATE INDEX IF NOT EXISTS idx_movie_cast_movie          ON movie_cast(movie_id);
  CREATE INDEX IF NOT EXISTS idx_movie_cast_person         ON movie_cast(person_id);
  CREATE INDEX IF NOT EXISTS idx_movie_companies_movie     ON movie_companies(movie_id);

  -- ── Default seed data ─────────────────────────────────────────────────────
  INSERT OR IGNORE INTO languages (name, code) VALUES
    ('English',  'en'), ('Hindi',    'hi'), ('Spanish',  'es'),
    ('French',   'fr'), ('German',   'de'), ('Japanese', 'ja'),
    ('Korean',   'ko'), ('Mandarin', 'zh'), ('Tamil',    'ta'),
    ('Telugu',   'te'), ('Arabic',   'ar'), ('Portuguese','pt'),
    ('Russian',  'ru'), ('Italian',  'it'), ('Turkish',  'tr');

  INSERT OR IGNORE INTO genres (name, slug) VALUES
    ('Action',      'action'),
    ('Adventure',   'adventure'),
    ('Animation',   'animation'),
    ('Comedy',      'comedy'),
    ('Crime',       'crime'),
    ('Documentary', 'documentary'),
    ('Drama',       'drama'),
    ('Fantasy',     'fantasy'),
    ('Horror',      'horror'),
    ('Musical',     'musical'),
    ('Mystery',     'mystery'),
    ('Romance',     'romance'),
    ('Sci-Fi',      'sci-fi'),
    ('Thriller',    'thriller'),
    ('Western',     'western');
`);

// ── Migrate existing movies table: add new columns safely ───────────────────
addColumnIfMissing("movies", "tagline", "TEXT");
addColumnIfMissing("movies", "status", "TEXT DEFAULT 'released'");
addColumnIfMissing("movies", "origin_country", "TEXT");
addColumnIfMissing("movies", "original_language", "TEXT");
addColumnIfMissing("movies", "age_rating", "TEXT");
// addColumnIfMissing("movies", "imdb_id", "TEXT UNIQUE");
// addColumnIfMissing("movies", "tmdb_id", "INTEGER UNIQUE");
addColumnIfMissing("movies", "imdb_id", "TEXT");
addColumnIfMissing("movies", "tmdb_id", "INTEGER");
db.exec(
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_movies_imdb_id ON movies(imdb_id)`,
);
db.exec(
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_movies_tmdb_id ON movies(tmdb_id)`,
);
addColumnIfMissing("languages", "native_script", "TEXT");
addColumnIfMissing("movies", "budget", "INTEGER");
addColumnIfMissing("movies", "box_office", "INTEGER");
addColumnIfMissing("movies", "rating_imdb", "REAL");
addColumnIfMissing("movies", "rating_rt", "INTEGER");
addColumnIfMissing("movies", "rating_metacritic", "INTEGER");
addColumnIfMissing("movies", "trailer_url", "TEXT");
addColumnIfMissing("movies", "backdrop_url", "TEXT");

console.log("✅ Database ready");

export default db;
