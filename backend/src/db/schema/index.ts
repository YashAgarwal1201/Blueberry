import { relations } from "drizzle-orm";
import { user, session, account, verification } from "./auth";
import { movies, tvShows, tvSeasons, tvEpisodes, userWatchedEpisodes } from "./media";
import { languages, movieLanguages, tvLanguages, genres, movieGenres, tvGenres } from "./taxonomy";
import { people, movieCast, tvCast, personKnownFor, companies, movieCompanies, tvCompanies } from "./credits";
import { watchlist, collections, collectionItems } from "./userContent";

// Export all tables
export * from "./auth";
export * from "./media";
export * from "./taxonomy";
export * from "./credits";
export * from "./userContent";

// ── Relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  collections: many(collections),
  watchedEpisodes: many(userWatchedEpisodes),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  languages: many(movieLanguages),
  genres: many(movieGenres),
  cast: many(movieCast),
  companies: many(movieCompanies),
  collectionItems: many(collectionItems),
  watchlistEntries: many(watchlist),
}));

export const tvShowsRelations = relations(tvShows, ({ many }) => ({
  seasons: many(tvSeasons),
  episodes: many(tvEpisodes),
  languages: many(tvLanguages),
  genres: many(tvGenres),
  cast: many(tvCast),
  companies: many(tvCompanies),
  collectionItems: many(collectionItems),
  watchlistEntries: many(watchlist),
  watchedEpisodes: many(userWatchedEpisodes),
}));

export const tvSeasonsRelations = relations(tvSeasons, ({ one, many }) => ({
  show: one(tvShows, { fields: [tvSeasons.show_id], references: [tvShows.id] }),
  episodes: many(tvEpisodes),
}));

export const tvEpisodesRelations = relations(tvEpisodes, ({ one, many }) => ({
  season: one(tvSeasons, { fields: [tvEpisodes.season_id], references: [tvSeasons.id] }),
  show: one(tvShows, { fields: [tvEpisodes.show_id], references: [tvShows.id] }),
  watchedEntries: many(userWatchedEpisodes),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(user, { fields: [collections.user_id], references: [user.id] }),
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections, { fields: [collectionItems.collection_id], references: [collections.id] }),
  movie: one(movies, { fields: [collectionItems.movie_id], references: [movies.id] }),
  show: one(tvShows, { fields: [collectionItems.show_id], references: [tvShows.id] }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  movie: one(movies, { fields: [watchlist.movie_id], references: [movies.id] }),
  show: one(tvShows, { fields: [watchlist.show_id], references: [tvShows.id] }),
}));
