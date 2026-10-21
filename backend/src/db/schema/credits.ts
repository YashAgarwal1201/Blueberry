import { sqliteTable, text, integer, real, index, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { movies, tvShows } from "./media";

export const people = sqliteTable("people", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").unique(),
  name: text("name").notNull(),
  also_known_as: text("also_known_as"),
  bio: text("bio"),
  birth_date: text("birth_date"),
  birth_place: text("birth_place"),
  profile_url: text("profile_url"),
  tmdb_id: integer("tmdb_id").unique(),
  imdb_id: text("imdb_id").unique(),
  tmdb_profile_path: text("tmdb_profile_path"),
  local_profile_url: text("local_profile_url"),
  gender: text("gender"),
  known_for_department: text("known_for_department"),
  wikidata_id: text("wikidata_id"),
  homepage: text("homepage"),
  popularity: real("popularity"),
  death_date: text("death_date"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const movieCast = sqliteTable("movie_cast", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movie_id: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  person_id: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("actor"),
  character: text("character"),
  display_order: integer("display_order").notNull().default(0),
}, (table) => [
  uniqueIndex("uniq_movie_cast_person_role").on(table.movie_id, table.person_id, table.role),
  index("idx_movie_cast_movie").on(table.movie_id),
  index("idx_movie_cast_person").on(table.person_id),
]);

export const tvCast = sqliteTable("tv_cast", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  show_id: integer("show_id")
    .notNull()
    .references(() => tvShows.id, { onDelete: "cascade" }),
  person_id: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("actor"),
  character: text("character"),
  display_order: integer("display_order").notNull().default(0),
}, (table) => [
  uniqueIndex("uniq_tv_cast_person_role").on(table.show_id, table.person_id, table.role),
  index("idx_tv_cast_show").on(table.show_id),
  index("idx_tv_cast_person").on(table.person_id),
]);

export const personKnownFor = sqliteTable("person_known_for", {
  person_id: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  movie_id: integer("movie_id")
    .references(() => movies.id, { onDelete: "set null" }),
  show_id: integer("show_id")
    .references(() => tvShows.id, { onDelete: "set null" }),
  display_order: integer("display_order").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.person_id, table.movie_id, table.show_id] }),
]);

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("production"),
  logo_url: text("logo_url"),
  country: text("country"),
  tmdb_id: integer("tmdb_id").unique(),
  tmdb_logo_path: text("tmdb_logo_path"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const movieCompanies = sqliteTable("movie_companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movie_id: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  company_id: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("production"),
}, (table) => [
  uniqueIndex("uniq_movie_company_role").on(table.movie_id, table.company_id, table.role),
  index("idx_movie_companies_movie").on(table.movie_id),
]);

export const tvCompanies = sqliteTable("tv_companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  show_id: integer("show_id")
    .notNull()
    .references(() => tvShows.id, { onDelete: "cascade" }),
  company_id: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("production"),
}, (table) => [
  uniqueIndex("uniq_tv_company_role").on(table.show_id, table.company_id, table.role),
  index("idx_tv_companies_show").on(table.show_id),
]);
