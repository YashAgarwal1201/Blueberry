import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";
import { movies, tvShows } from "./media";

export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movie_id: integer("movie_id")
    .references(() => movies.id, { onDelete: "cascade" }),
  show_id: integer("show_id")
    .references(() => tvShows.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  added_at: text("added_at").default(sql`(datetime('now'))`),
  watched_at: text("watched_at"),
  notes: text("notes"),
  updated_at: text("updated_at"),
  user_rating: integer("user_rating"),
  liked: integer("liked").default(0),
  review_text: text("review_text"),
  watch_count: integer("watch_count").default(0),
  last_watched_at: text("last_watched_at"),
  source: text("source"),
}, (table) => [
  uniqueIndex("uniq_watchlist_movie").on(table.movie_id),
  uniqueIndex("uniq_watchlist_show").on(table.show_id),
  index("idx_watchlist_movie").on(table.movie_id),
  index("idx_watchlist_show").on(table.show_id),
  index("idx_watchlist_status").on(table.status),
  index("idx_watchlist_updated_at").on(table.updated_at),
]);

export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  poster_url: text("poster_url"),
  privacy: text("privacy").notNull().default("private"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("uniq_collections_user_slug").on(table.user_id, table.slug),
]);

export const collectionItems = sqliteTable("collection_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  collection_id: integer("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  movie_id: integer("movie_id")
    .references(() => movies.id, { onDelete: "cascade" }),
  show_id: integer("show_id")
    .references(() => tvShows.id, { onDelete: "cascade" }),
  display_order: integer("display_order").notNull().default(0),
}, (table) => [
  uniqueIndex("uniq_collection_movie").on(table.collection_id, table.movie_id),
  uniqueIndex("uniq_collection_show").on(table.collection_id, table.show_id),
  index("idx_collection_items_collection").on(table.collection_id),
  index("idx_collection_items_movie").on(table.movie_id),
  index("idx_collection_items_show").on(table.show_id),
]);
