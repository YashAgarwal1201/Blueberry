/**
 * plugins/wikidata/mapper.ts
 *
 * Maps SPARQL row results into PluginMoviePayload/PluginTVPayload.
 */

import type { PluginMoviePayload, CastRole, CompanyType } from "shared-types";
import { type SparqlRow, wikimediaCommonsUrl } from "./client";

// ── Shared mapping utilities ──────────────────────────────────────────────────

function mapGenre(label: string): string {
  // convert something like "science fiction film" to "sci-fi"
  const l = label.toLowerCase();
  if (l.includes("science fiction")) return "sci-fi";
  if (l.includes("romantic comedy")) return "romance";
  return l.replace(/ film$/, "").replace(/ television series$/, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").trim();
}

function mapLanguage(label: string): string {
  // We need to map "English" to "en", etc.
  // We'll do a simple map of common ones, but ideal is ISO lookup.
  const map: Record<string, string> = {
    "english": "en", "french": "fr", "spanish": "es", "german": "de",
    "japanese": "ja", "korean": "ko", "italian": "it", "hindi": "hi",
    "portuguese": "pt", "russian": "ru", "chinese": "zh", "mandarin": "zh",
    "cantonese": "zh", "swedish": "sv", "danish": "da", "norwegian": "no",
  };
  return map[label.toLowerCase()] || label.substring(0, 2).toLowerCase();
}

// ── Mapper ───────────────────────────────────────────────────────────────────

export function mapWikidataMovie(row: SparqlRow): PluginMoviePayload {
  const title = row.filmLabel?.value;
  const tmdbId = row.tmdbId?.value ? parseInt(row.tmdbId.value) : undefined;
  const imdbId = row.imdbId?.value;
  const wikidataId = row.film?.value.split('/').pop();

  const releaseYear = row.year?.value ? parseInt(row.year.value) : undefined;
  const runtime = row.runtime?.value ? parseInt(row.runtime.value) : undefined;
  
  const posterFile = row.poster?.value ? decodeURIComponent(row.poster.value.split('/').pop() || '') : undefined;
  const posterUrl = posterFile ? wikimediaCommonsUrl(posterFile) : undefined;

  // Split concatenated fields
  const castRaw = row.cast?.value ? row.cast.value.split('|').filter(Boolean) : [];
  const genresRaw = row.genres?.value ? row.genres.value.split('|').filter(Boolean) : [];
  const companiesRaw = row.companies?.value ? row.companies.value.split('|').filter(Boolean) : [];
  const directorsRaw = row.directors?.value ? row.directors.value.split('|').filter(Boolean) : [];

  const genreSlugs = genresRaw.map(mapGenre);
  const langCodes = row.origLangLabel?.value ? [mapLanguage(row.origLangLabel.value)] : [];

  const cast: PluginMoviePayload["cast"] = [];
  
  castRaw.forEach((name, i) => {
    cast.push({ name, role: "actor", display_order: i });
  });
  
  directorsRaw.forEach(name => {
    // avoid dupe if director also acted
    if (!cast.find(c => c.name === name && c.role === 'director')) {
      cast.push({ name, role: "director", display_order: 1000 });
    }
  });

  const companies = companiesRaw.slice(0, 5).map(name => ({
    name,
    role: "production" as CompanyType
  }));

  return {
    title,
    tmdb_id: tmdbId,
    imdb_id: imdbId,
    wikidata_id: wikidataId,
    
    release_year: releaseYear,
    runtime,
    status: "released",
    original_language: langCodes[0],
    
    tmdb_poster_path: posterUrl, // This gets passed to frontend, starts with http -> raw url
    
    genre_slugs: genreSlugs,
    language_codes: langCodes,
    cast,
    companies
  };
}
