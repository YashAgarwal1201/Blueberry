import db from "../db";

export function getBlockConditions(userId?: string): { clause: string, andClause: string, params: string[] } {
  if (!userId) return { clause: "", andClause: "", params: [] };
  
  const row = db.prepare(`SELECT preferences FROM "user" WHERE id = ?`).get(userId) as any;
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
  
  const row = db.prepare(`SELECT preferences FROM "user" WHERE id = ?`).get(userId) as any;
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
