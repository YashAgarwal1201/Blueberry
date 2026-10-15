import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const movies = sqliteTable("movies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").unique(),
  title: text("title").notNull(),
  tagline: text("tagline"),
  description: text("description").default(""),
  status: text("status").default("released"),
  release_year: integer("release_year"),
  director: text("director"),
  poster_url: text("poster_url"),
  backdrop_url: text("backdrop_url"),
  trailer_url: text("trailer_url"),
  runtime: integer("runtime"),
  origin_country: text("origin_country"),
  original_language: text("original_language"),
  age_rating: text("age_rating"),
  imdb_id: text("imdb_id").unique(),
  tmdb_id: integer("tmdb_id").unique(),
  letterboxd_id: text("letterboxd_id"),
  wikidata_id: text("wikidata_id"),
  rottentomatoes_id: text("rottentomatoes_id"),
  budget: integer("budget"),
  box_office: integer("box_office"),
  rating_imdb: real("rating_imdb"),
  rating_rt: integer("rating_rt"),
  rating_metacritic: integer("rating_metacritic"),
  tmdb_poster_path: text("tmdb_poster_path"),
  tmdb_backdrop_path: text("tmdb_backdrop_path"),
  tmdb_trailer_key: text("tmdb_trailer_key"),
  local_poster_url: text("local_poster_url"),
  local_backdrop_url: text("local_backdrop_url"),
  image_source: text("image_source").default("local"),
  spoken_languages: text("spoken_languages"),
  production_countries: text("production_countries"),
  keywords: text("keywords"),
  content_advisory: text("content_advisory"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_movies_rating_imdb").on(table.rating_imdb),
  index("idx_movies_release_year").on(table.release_year),
  index("idx_movies_created_at").on(table.created_at),
]);

export const tvShows = sqliteTable("tv_shows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").unique(),
  title: text("title").notNull(),
  tagline: text("tagline"),
  description: text("description").default(""),
  status: text("status").default("returning_series"),
  first_air_date: text("first_air_date"),
  last_air_date: text("last_air_date"),
  poster_url: text("poster_url"),
  backdrop_url: text("backdrop_url"),
  tmdb_id: integer("tmdb_id").unique(),
  imdb_id: text("imdb_id").unique(),
  letterboxd_id: text("letterboxd_id").unique(),
  network: text("network"),
  origin_country: text("origin_country"),
  original_language: text("original_language"),
  age_rating: text("age_rating"),
  keywords: text("keywords"),
  wikidata_id: text("wikidata_id"),
  rating_imdb: real("rating_imdb"),
  rating_rt: integer("rating_rt"),
  rating_metacritic: integer("rating_metacritic"),
  episode_count: integer("episode_count").default(0),
  season_count: integer("season_count").default(0),
  runtime_per_episode: integer("runtime_per_episode"),
  budget: integer("budget"),
  box_office: integer("box_office"),
  tmdb_poster_path: text("tmdb_poster_path"),
  tmdb_backdrop_path: text("tmdb_backdrop_path"),
  image_source: text("image_source").default("local"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_tv_rating").on(table.rating_imdb),
  index("idx_tv_air_date").on(table.first_air_date),
  index("idx_tv_status").on(table.status),
  index("idx_tv_episode_count").on(table.episode_count),
]);

export const tvSeasons = sqliteTable("tv_seasons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").unique(),
  show_id: integer("show_id")
    .notNull()
    .references(() => tvShows.id, { onDelete: "cascade" }),
  season_number: integer("season_number").notNull(),
  title: text("title").notNull(),
  overview: text("overview"),
  poster_url: text("poster_url"),
  episode_count: integer("episode_count").default(0),
  air_date: text("air_date"),
  tmdb_id: integer("tmdb_id").unique(),
  tmdb_poster_path: text("tmdb_poster_path"),
}, (table) => [
  uniqueIndex("uniq_tv_seasons_show_season").on(table.show_id, table.season_number),
]);

export const tvEpisodes = sqliteTable("tv_episodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").unique(),
  season_id: integer("season_id")
    .notNull()
    .references(() => tvSeasons.id, { onDelete: "cascade" }),
  show_id: integer("show_id")
    .notNull()
    .references(() => tvShows.id, { onDelete: "cascade" }),
  episode_number: integer("episode_number").notNull(),
  title: text("title").notNull(),
  overview: text("overview"),
  air_date: text("air_date"),
  runtime: integer("runtime"),
  still_url: text("still_url"),
  tmdb_id: integer("tmdb_id").unique(),
  imdb_id: text("imdb_id").unique(),
  tmdb_still_path: text("tmdb_still_path"),
}, (table) => [
  uniqueIndex("uniq_tv_episodes_season_episode").on(table.season_id, table.episode_number),
]);

export const userWatchedEpisodes = sqliteTable("user_watched_episodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  show_id: integer("show_id")
    .notNull()
    .references(() => tvShows.id, { onDelete: "cascade" }),
  season_id: integer("season_id")
    .references(() => tvSeasons.id, { onDelete: "cascade" }),
  episode_id: integer("episode_id")
    .notNull()
    .references(() => tvEpisodes.id, { onDelete: "cascade" }),
  season_number: integer("season_number").notNull(),
  episode_number: integer("episode_number").notNull(),
  watched_at: text("watched_at").default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("uniq_user_episode").on(table.user_id, table.episode_id),
  index("idx_user_watched_show").on(table.user_id, table.show_id),
]);
