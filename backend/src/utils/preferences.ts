import db, {
  user as userTable,
  movies as moviesTable,
  movieGenres as movieGenresTable,
  genres as genresTable,
  movieLanguages as movieLanguagesTable,
  languages as languagesTable,
} from "../db";
import { eq, inArray, notInArray, and, type SQL } from "drizzle-orm";

export function getMovieBlockCondition(userId?: string): SQL | undefined {
  if (!userId) return undefined;
  
  const row = db
    .select({ preferences: userTable.preferences })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .get();
  if (!row || !row.preferences) return undefined;
  
  try {
    const prefs = JSON.parse(row.preferences);
    const conditions: SQL[] = [];

    const blockedGenres = prefs.blockedGenres || [];
    if (Array.isArray(blockedGenres) && blockedGenres.length > 0) {
      const blockedGenreSub = db
        .select({ movie_id: movieGenresTable.movie_id })
        .from(movieGenresTable)
        .innerJoin(genresTable, eq(genresTable.id, movieGenresTable.genre_id))
        .where(inArray(genresTable.slug, blockedGenres));
      conditions.push(notInArray(moviesTable.id, blockedGenreSub));
    }

    const blockedLanguages = prefs.blockedLanguages || [];
    if (Array.isArray(blockedLanguages) && blockedLanguages.length > 0) {
      const blockedLangSub = db
        .select({ movie_id: movieLanguagesTable.movie_id })
        .from(movieLanguagesTable)
        .innerJoin(languagesTable, eq(languagesTable.id, movieLanguagesTable.language_id))
        .where(inArray(languagesTable.code, blockedLanguages));
      conditions.push(notInArray(moviesTable.id, blockedLangSub));
    }

    const blockedMovies = prefs.blockedMovies || [];
    if (Array.isArray(blockedMovies) && blockedMovies.length > 0) {
      conditions.push(notInArray(moviesTable.uuid, blockedMovies));
    }

    if (conditions.length > 0) {
      return and(...conditions);
    }
  } catch (e) {
    console.error("Failed to parse preferences for movie block condition", e);
  }

  return undefined;
}

export function getBlockConditions(userId?: string): { clause: string, andClause: string, params: string[] } {
  if (!userId) return { clause: "", andClause: "", params: [] };
  
  const row = db
    .select({ preferences: userTable.preferences })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .get();
  if (!row || !row.preferences) return { clause: "", andClause: "", params: [] };
  
  try {
    const prefs = JSON.parse(row.preferences);
    const conditions: string[] = [];
    const params: string[] = [];

    const blockedGenres = prefs.blockedGenres || [];
    if (Array.isArray(blockedGenres) && blockedGenres.length > 0) {
       const placeholders = blockedGenres.map(() => "?").join(",");
       conditions.push(`m.id NOT IN (
         SELECT mg.movie_id FROM movie_genres mg
         JOIN genres g ON g.id = mg.genre_id
         WHERE g.slug IN (${placeholders})
       )`);
       params.push(...blockedGenres);
    }

    const blockedLanguages = prefs.blockedLanguages || [];
    if (Array.isArray(blockedLanguages) && blockedLanguages.length > 0) {
       const placeholders = blockedLanguages.map(() => "?").join(",");
       conditions.push(`m.id NOT IN (
         SELECT ml.movie_id FROM movie_languages ml
         JOIN languages l ON l.id = ml.language_id
         WHERE l.code IN (${placeholders})
       )`);
       params.push(...blockedLanguages);
    }

    const blockedMovies = prefs.blockedMovies || [];
    if (Array.isArray(blockedMovies) && blockedMovies.length > 0) {
       const placeholders = blockedMovies.map(() => "?").join(",");
       conditions.push(`m.uuid NOT IN (${placeholders})`);
       params.push(...blockedMovies);
    }

    if (conditions.length > 0) {
      const conditionStr = conditions.join(" AND ");
      return { 
        clause: `WHERE ${conditionStr}`, 
        andClause: `AND ${conditionStr}`,
        params 
      };
    }
  } catch (e) {
    console.error("Failed to parse preferences for block conditions", e);
  }

  return { clause: "", andClause: "", params: [] };
}

export function getTvBlockConditions(userId?: string): { clause: string, andClause: string, params: string[] } {
  if (!userId) return { clause: "", andClause: "", params: [] };
  
  const row = db
    .select({ preferences: userTable.preferences })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .get();
  if (!row || !row.preferences) return { clause: "", andClause: "", params: [] };
  
  try {
    const prefs = JSON.parse(row.preferences);
    const conditions: string[] = [];
    const params: string[] = [];

    const blockedGenres = prefs.blockedGenres || [];
    if (Array.isArray(blockedGenres) && blockedGenres.length > 0) {
       const placeholders = blockedGenres.map(() => "?").join(",");
       conditions.push(`t.id NOT IN (
         SELECT tg.show_id FROM tv_show_genres tg
         JOIN genres g ON g.id = tg.genre_id
         WHERE g.slug IN (${placeholders})
       )`);
       params.push(...blockedGenres);
    }

    const blockedLanguages = prefs.blockedLanguages || [];
    if (Array.isArray(blockedLanguages) && blockedLanguages.length > 0) {
       const placeholders = blockedLanguages.map(() => "?").join(",");
       conditions.push(`t.id NOT IN (
         SELECT tl.show_id FROM tv_show_languages tl
         JOIN languages l ON l.id = tl.language_id
         WHERE l.code IN (${placeholders})
       )`);
       params.push(...blockedLanguages);
    }

    const blockedShows = prefs.blockedShows || [];
    if (Array.isArray(blockedShows) && blockedShows.length > 0) {
       const placeholders = blockedShows.map(() => "?").join(",");
       conditions.push(`t.uuid NOT IN (${placeholders})`);
       params.push(...blockedShows);
    }

    if (conditions.length > 0) {
      const conditionStr = conditions.join(" AND ");
      return { 
        clause: `WHERE ${conditionStr}`, 
        andClause: `AND ${conditionStr}`,
        params 
      };
    }
  } catch (e) {
    console.error("Failed to parse preferences for tv block conditions", e);
  }

  return { clause: "", andClause: "", params: [] };
}
