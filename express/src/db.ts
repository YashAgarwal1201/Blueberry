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
  -- ── Better Auth ───────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "createdAt" date not null, "updatedAt" date not null, "role" text, "banned" integer, "banReason" text, "banExpires" date);
  CREATE TABLE IF NOT EXISTS "session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade, "impersonatedBy" text);
  CREATE TABLE IF NOT EXISTS "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null);
  CREATE TABLE IF NOT EXISTS "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null);

  CREATE TABLE IF NOT EXISTS movies (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid         TEXT UNIQUE,
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
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL UNIQUE,
    code          TEXT NOT NULL UNIQUE,
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
    movie_id   INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    show_id    INTEGER REFERENCES tv_shows(id) ON DELETE CASCADE,
    status     TEXT    NOT NULL CHECK(status IN ('want_to_watch','watching','watched')),
    added_at   TEXT    DEFAULT (datetime('now')),
    watched_at TEXT,
    notes      TEXT,
    CHECK (movie_id IS NOT NULL OR show_id IS NOT NULL),
    UNIQUE(movie_id),
    UNIQUE(show_id)
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
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid          TEXT UNIQUE,
    name          TEXT NOT NULL,
    also_known_as TEXT,
    bio           TEXT,
    birth_date    TEXT,
    birth_place   TEXT,
    profile_url   TEXT,
    tmdb_id       INTEGER UNIQUE,
    imdb_id       TEXT UNIQUE,
    created_at    TEXT DEFAULT (datetime('now'))
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
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    type       TEXT NOT NULL DEFAULT 'production'
               CHECK(type IN ('production','distribution','streaming')),
    logo_url   TEXT,
    country    TEXT,
    tmdb_id    INTEGER UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );


  CREATE TABLE IF NOT EXISTS movie_companies (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id   INTEGER NOT NULL REFERENCES movies(id)    ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role       TEXT NOT NULL DEFAULT 'production'
               CHECK(role IN ('production','distribution','streaming')),
    UNIQUE(movie_id, company_id, role)
  );


  -- ── Collections ───────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS collections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    poster_url  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );


  CREATE TABLE IF NOT EXISTS collection_movies (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    movie_id      INTEGER NOT NULL REFERENCES movies(id)      ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(collection_id, movie_id)
  );

  -- ── TV Shows ─────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS tv_shows (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid             TEXT UNIQUE,
    title            TEXT NOT NULL,
    description      TEXT DEFAULT '',
    status           TEXT DEFAULT 'returning_series'
                     CHECK(status IN ('returning_series','planned','in_production','ended','canceled','pilot')),
    first_air_date   TEXT,
    last_air_date    TEXT,
    poster_url       TEXT,
    backdrop_url     TEXT,
    tmdb_id          INTEGER UNIQUE,
    imdb_id          TEXT UNIQUE,
    letterboxd_id    TEXT UNIQUE,
    network          TEXT,
    created_at       TEXT DEFAULT (datetime('now')),
    updated_at       TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tv_seasons (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid             TEXT UNIQUE,
    show_id          INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
    season_number    INTEGER NOT NULL,
    title            TEXT NOT NULL,
    overview         TEXT,
    poster_url       TEXT,
    episode_count    INTEGER DEFAULT 0,
    air_date         TEXT,
    tmdb_id          INTEGER UNIQUE,
    UNIQUE(show_id, season_number)
  );

  CREATE TABLE IF NOT EXISTS tv_episodes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid             TEXT UNIQUE,
    season_id        INTEGER NOT NULL REFERENCES tv_seasons(id) ON DELETE CASCADE,
    show_id          INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
    episode_number   INTEGER NOT NULL,
    title            TEXT NOT NULL,
    overview         TEXT,
    air_date         TEXT,
    runtime          INTEGER,
    still_url        TEXT,
    tmdb_id          INTEGER UNIQUE,
    imdb_id          TEXT UNIQUE,
    UNIQUE(season_id, episode_number)
  );


  -- ── Indexes ───────────────────────────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_movie_languages_movie        ON movie_languages(movie_id);
  CREATE INDEX IF NOT EXISTS idx_movie_languages_language     ON movie_languages(language_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_movie              ON watchlist(movie_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_show               ON watchlist(show_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_status             ON watchlist(status);
  CREATE INDEX IF NOT EXISTS idx_movie_genres_movie           ON movie_genres(movie_id);
  CREATE INDEX IF NOT EXISTS idx_movie_genres_genre           ON movie_genres(genre_id);
  CREATE INDEX IF NOT EXISTS idx_movie_cast_movie             ON movie_cast(movie_id);
  CREATE INDEX IF NOT EXISTS idx_movie_cast_person            ON movie_cast(person_id);
  CREATE INDEX IF NOT EXISTS idx_movie_companies_movie        ON movie_companies(movie_id);
  CREATE INDEX IF NOT EXISTS idx_collection_movies_collection ON collection_movies(collection_id);
  CREATE INDEX IF NOT EXISTS idx_collection_movies_movie      ON collection_movies(movie_id);

  CREATE INDEX IF NOT EXISTS "session_userId_idx" on "session" ("userId");
  CREATE INDEX IF NOT EXISTS "account_userId_idx" on "account" ("userId");
  CREATE INDEX IF NOT EXISTS "verification_identifier_idx" on "verification" ("identifier");


  -- ── Default seed data ─────────────────────────────────────────────────────
  INSERT OR IGNORE INTO languages (name, code, native_script) VALUES
    ('English',    'en', 'English'),
    ('Hindi',      'hi', 'हिन्दी'),
    ('Spanish',    'es', 'Español'),
    ('French',     'fr', 'Français'),
    ('German',     'de', 'Deutsch'),
    ('Japanese',   'ja', '日本語'),
    ('Korean',     'ko', '한국어'),
    ('Mandarin',   'zh', '中文'),
    ('Tamil',      'ta', 'தமிழ்'),
    ('Telugu',     'te', 'తెలుగు'),
    ('Arabic',     'ar', 'العربية'),
    ('Portuguese', 'pt', 'Português'),
    ('Russian',    'ru', 'Русский'),
    ('Italian',    'it', 'Italiano'),
    ('Turkish',    'tr', 'Türkçe'),
    ('Bengali',    'bn', 'বাংলা'),
    ('Polish',     'pl', 'Polski'),
    ('Dutch',      'nl', 'Nederlands'),
    ('Swedish',    'sv', 'Svenska'),
    ('Indonesian', 'id', 'Bahasa Indonesia'),
    ('Vietnamese', 'vi', 'Tiếng Việt'),
    ('Thai',       'th', 'ไทย'),
    ('Greek',      'el', 'Ελληνικά'),
    ('Hebrew',     'he', 'עברית'),
    ('Danish',     'da', 'Dansk'),
    ('Finnish',    'fi', 'Suomi'),
    ('Norwegian',  'no', 'Norsk'),
    ('Malayalam',  'ml', 'മലയാളം'),
    ('Kannada',    'kn', 'ಕನ್ನಡ'),
    ('Marathi',    'mr', 'मराठी'),
    ('Punjabi',    'pa', 'ਪੰਜਾਬੀ'),
    ('Gujarati',   'gu', 'ગુજરાતી');


  INSERT OR IGNORE INTO genres (name, slug) VALUES
    ('Action',      'action'),
    ('Adventure',   'adventure'),
    ('Animation',   'animation'),
    ('Biography',   'biography'),
    ('Comedy',      'comedy'),
    ('Crime',       'crime'),
    ('Documentary', 'documentary'),
    ('Drama',       'drama'),
    ('Family',      'family'),
    ('Fantasy',     'fantasy'),
    ('History',     'history'),
    ('Horror',      'horror'),
    ('Music',       'music'),
    ('Musical',     'musical'),
    ('Mystery',     'mystery'),
    ('News',        'news'),
    ('Reality-TV',  'reality-tv'),
    ('Romance',     'romance'),
    ('Sci-Fi',      'sci-fi'),
    ('Short',       'short'),
    ('Sport',       'sport'),
    ('Talk-Show',   'talk-show'),
    ('Thriller',    'thriller'),
    ('War',         'war'),
    ('Western',     'western');
`);

// ── Migrations: add new columns to existing tables safely ───────────────────
// Rule: indexes on migrated columns must live AFTER addColumnIfMissing,
//       never inside the db.exec() block above — CREATE TABLE is skipped for
//       existing tables but indexes would still run against the old schema.

addColumnIfMissing("movies", "tagline", "TEXT");
addColumnIfMissing("movies", "status", "TEXT DEFAULT 'released'");
addColumnIfMissing("movies", "origin_country", "TEXT");
addColumnIfMissing("movies", "original_language", "TEXT");
addColumnIfMissing("movies", "age_rating", "TEXT");
addColumnIfMissing("movies", "imdb_id", "TEXT");
addColumnIfMissing("movies", "tmdb_id", "INTEGER");
addColumnIfMissing("movies", "budget", "INTEGER");
addColumnIfMissing("movies", "box_office", "INTEGER");
addColumnIfMissing("movies", "rating_imdb", "REAL");
addColumnIfMissing("movies", "rating_rt", "INTEGER");
addColumnIfMissing("movies", "rating_metacritic", "INTEGER");
addColumnIfMissing("movies", "trailer_url", "TEXT");
addColumnIfMissing("movies", "backdrop_url", "TEXT");
addColumnIfMissing("movies", "uuid", "TEXT");
addColumnIfMissing("movies", "letterboxd_id", "TEXT");

addColumnIfMissing("people", "uuid", "TEXT");

db.exec(`UPDATE movies SET uuid = lower(hex(randomblob(16))) WHERE uuid IS NULL`);
db.exec(`UPDATE people SET uuid = lower(hex(randomblob(16))) WHERE uuid IS NULL`);

addColumnIfMissing("languages", "native_script", "TEXT");

const languageScripts: Record<string, string> = {
  en: 'English', hi: 'हिन्दी', es: 'Español', fr: 'Français',
  de: 'Deutsch', ja: '日本語', ko: '한국어', zh: '中文',
  ta: 'தமிழ்', te: 'తెలుగు', ar: 'العربية', pt: 'Português',
  ru: 'Русский', it: 'Italiano', tr: 'Türkçe', bn: 'বাংলা',
  pl: 'Polski', nl: 'Nederlands', sv: 'Svenska', id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt', th: 'ไทย', el: 'Ελληνικά', he: 'עברית',
  da: 'Dansk', fi: 'Suomi', no: 'Norsk', ml: 'മലയാളം',
  kn: 'ಕನ್ನಡ', mr: 'मराठी', pa: 'ਪੰਜਾਬੀ', gu: 'ગુજરાતી'
};

const updateLangStmt = db.prepare(`UPDATE languages SET native_script = ? WHERE code = ? AND (native_script IS NULL OR native_script = '')`);
db.transaction(() => {
  for (const [code, script] of Object.entries(languageScripts)) {
    updateLangStmt.run(script, code);
  }
})();

// watchlist columns added after initial schema
addColumnIfMissing("watchlist", "notes", "TEXT");
addColumnIfMissing("watchlist", "updated_at", "TEXT");
db.exec(`UPDATE watchlist SET updated_at = added_at WHERE updated_at IS NULL`);

// better-auth missing columns
addColumnIfMissing("account", "issuer", "TEXT");
addColumnIfMissing("user", "preferences", "TEXT DEFAULT '{}'");

// Unique + post-migration indexes — all safe to re-run (IF NOT EXISTS)
db.exec(
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_movies_imdb_id      ON movies(imdb_id)`,
);
db.exec(
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_movies_tmdb_id      ON movies(tmdb_id)`,
);
db.exec(
  `CREATE        INDEX IF NOT EXISTS idx_watchlist_updated_at  ON watchlist(updated_at)`,
);

console.log("✅ Database ready");

export default db;
