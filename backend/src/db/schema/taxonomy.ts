import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { movies, tvShows } from "./media";

export const languages = sqliteTable("languages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  native_script: text("native_script"),
});

export const movieLanguages = sqliteTable("movie_languages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movie_id: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  language_id: integer("language_id")
    .notNull()
    .references(() => languages.id, { onDelete: "cascade" }),
}, (table) => [
  uniqueIndex("uniq_movie_language").on(table.movie_id, table.language_id),
  index("idx_movie_languages_movie").on(table.movie_id),
  index("idx_movie_languages_language").on(table.language_id),
]);

export const tvLanguages = sqliteTable("tv_languages", {
  show_id: integer("show_id")
    .notNull()
    .references(() => tvShows.id, { onDelete: "cascade" }),
  language_id: integer("language_id")
    .notNull()
    .references(() => languages.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.show_id, table.language_id] }),
  index("idx_tv_languages_show").on(table.show_id),
  index("idx_tv_languages_language").on(table.language_id),
]);

export const genres = sqliteTable("genres", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const movieGenres = sqliteTable("movie_genres", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movie_id: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  genre_id: integer("genre_id")
    .notNull()
    .references(() => genres.id, { onDelete: "cascade" }),
}, (table) => [
  uniqueIndex("uniq_movie_genre").on(table.movie_id, table.genre_id),
  index("idx_movie_genres_movie").on(table.movie_id),
  index("idx_movie_genres_genre").on(table.genre_id),
]);

export const tvGenres = sqliteTable("tv_genres", {
  show_id: integer("show_id")
    .notNull()
    .references(() => tvShows.id, { onDelete: "cascade" }),
  genre_id: integer("genre_id")
    .notNull()
    .references(() => genres.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.show_id, table.genre_id] }),
  index("idx_tv_genres_show").on(table.show_id),
  index("idx_tv_genres_genre").on(table.genre_id),
]);
