// src/db/client.ts
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

export type Schema = typeof schema;
export type DrizzleDb = BetterSQLite3Database<Schema>;

export interface DatabaseAdapterOptions {
  databaseUrl?: string;
  isTest?: boolean;
}

/**
 * Creates and configures the database connection for Blueberry.
 * Defaults to local SQLite via better-sqlite3 with full schema definitions.
 * Designed to support Cloudflare D1, LibSQL (Turso), and PostgreSQL drivers in Phase 4.
 */
export function createDatabaseAdapter(options: DatabaseAdapterOptions = {}) {
  const isTest = options.isTest ?? (process.env.NODE_ENV === "test");
  const rawDbPath = process.env.DATABASE_PATH || options.databaseUrl || (process.env.DATABASE_URL?.startsWith("sqlite:") ? process.env.DATABASE_URL.replace(/^sqlite:\/\//, "") : undefined);
  const dbFile = isTest ? ":memory:" : (rawDbPath ? path.resolve(rawDbPath) : path.resolve(process.cwd(), "data", "app.db"));
  const dir = isTest ? "" : path.dirname(dbFile);

  if (!isTest && dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbFile);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");

  const orm = drizzle(sqlite, { schema });

  return {
    sqlite,
    orm,
  };
}
