/**
 * plugins/csv/mapper.ts
 *
 * Maps a single TMDB Kaggle CSV row → PluginMoviePayload.
 * The CSV has these key fields:
 *   id, title, vote_average, vote_count, status, release_date, revenue,
 *   runtime, adult, backdrop_path, budget, homepage, imdb_id, original_language,
 *   original_title, overview, popularity, poster_path, tagline,
 *   genres, production_companies, production_countries, spoken_languages, keywords
 */

import type { PluginMoviePayload, MovieStatus } from "shared-types";

// ── Genre name → our slug ─────────────────────────────────────────────────────
const GENRE_MAP: Record<string, string> = {
  "Action":           "action",
  "Adventure":        "adventure",
  "Animation":        "animation",
  "Comedy":           "comedy",
  "Crime":            "crime",
  "Documentary":      "documentary",
  "Drama":            "drama",
  "Family":           "family",
  "Fantasy":          "fantasy",
  "History":          "history",
  "Horror":           "horror",
  "Music":            "music",
  "Mystery":          "mystery",
  "Romance":          "romance",
  "Science Fiction":  "sci-fi",
  "Thriller":         "thriller",
  "War":              "war",
  "Western":          "western",
  // TV Genres
  "Action & Adventure": "action-adventure",
  "Sci-Fi & Fantasy": "sci-fi-fantasy",
  "Kids":             "kids",
  "News":             "news",
  "Reality":          "reality",
  "Soap":             "soap",
  "Talk":             "talk",
  "War & Politics":   "war-politics",
  "Musical":          "music",
};

// ── Language full name → ISO 639-1 code ──────────────────────────────────────
const LANGUAGE_MAP: Record<string, string> = {
  "English": "en", "French": "fr", "Spanish": "es", "German": "de",
  "Japanese": "ja", "Korean": "ko", "Italian": "it", "Hindi": "hi",
  "Portuguese": "pt", "Russian": "ru", "Arabic": "ar", "Chinese": "zh",
  "Mandarin": "zh", "Cantonese": "zh", "Swedish": "sv", "Danish": "da",
  "Norwegian": "no", "Dutch": "nl", "Finnish": "fi", "Turkish": "tr",
  "Tamil": "ta", "Telugu": "te", "Bengali": "bn", "Punjabi": "pa",
  "Marathi": "mr", "Malayalam": "ml", "Gujarati": "gu", "Kannada": "kn",
  "Polish": "pl", "Thai": "th", "Vietnamese": "vi", "Greek": "el",
  "Hebrew": "he", "Indonesian": "id", "Ukrainian": "uk", "Czech": "cs",
  "Romanian": "ro", "Hungarian": "hu", "Bulgarian": "bg", "Croatian": "hr",
  "Slovak": "sk", "Catalan": "ca", "Basque": "eu", "Galician": "gl",
  "Albanian": "sq", "Serbian": "sr", "Bosnian": "bs", "Lithuanian": "lt",
  "Latvian": "lv", "Estonian": "et", "Slovenian": "sl", "Macedonian": "mk",
  "Afrikaans": "af", "Swahili": "sw", "Amharic": "am", "Persian": "fa",
  "Farsi": "fa", "Urdu": "ur", "Sinhalese": "si", "Nepali": "ne",
  "Burmese": "my", "Khmer": "km", "Mongolian": "mn", "Georgian": "ka",
  "Armenian": "hy", "Azerbaijani": "az", "Kazakh": "kk", "Uzbek": "uz",
};

// ── Status mapping ────────────────────────────────────────────────────────────
function mapStatus(raw: string): MovieStatus {
  switch (raw.trim()) {
    case "Released":        return "released";
    case "In Production":
    case "Post Production": return "in_production";
    case "Planned":
    case "Rumored":         return "upcoming";
    case "Canceled":        return "cancelled";
    default:                return "released";
  }
}

function mapTVStatus(raw: string): import("shared-types").TVStatus {
  switch (raw.trim()) {
    case "Returning Series": return "returning_series";
    case "Planned":          return "planned";
    case "In Production":    return "in_production";
    case "Ended":            return "ended";
    case "Canceled":         return "canceled";
    case "Pilot":            return "pilot";
    default:                 return "returning_series";
  }
}

// ── Country full name → ISO 3166-1 alpha-2 ───────────────────────────────────
const COUNTRY_MAP: Record<string, string> = {
  "United States of America": "US", "United Kingdom": "GB", "France": "FR",
  "Germany": "DE", "Japan": "JP", "South Korea": "KR", "Italy": "IT",
  "Spain": "ES", "India": "IN", "China": "CN", "Canada": "CA",
  "Australia": "AU", "Russia": "RU", "Brazil": "BR", "Mexico": "MX",
  "Sweden": "SE", "Denmark": "DK", "Norway": "NO", "Finland": "FI",
  "Netherlands": "NL", "Belgium": "BE", "Switzerland": "CH", "Austria": "AT",
  "Portugal": "PT", "Poland": "PL", "Czech Republic": "CZ", "Hungary": "HU",
  "Romania": "RO", "Turkey": "TR", "Iran": "IR", "Israel": "IL",
  "Argentina": "AR", "Chile": "CL", "Colombia": "CO", "Peru": "PE",
  "Thailand": "TH", "Indonesia": "ID", "Malaysia": "MY", "Philippines": "PH",
  "Hong Kong": "HK", "Taiwan": "TW", "New Zealand": "NZ", "Ireland": "IE",
};

// ── CSV row shape ─────────────────────────────────────────────────────────────
export interface CSVRow {
  id: string;
  title: string;
  vote_average: string;
  vote_count: string;
  status: string;
  release_date: string;
  revenue: string;
  runtime: string;
  adult: string;
  backdrop_path: string;
  budget: string;
  homepage: string;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: string;
  poster_path: string;
  tagline: string;
  genres: string;
  production_companies: string;
  production_countries: string;
  spoken_languages: string;
  keywords: string;
}

function split(val: string): string[] {
  if (!val?.trim()) return [];
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function numOrNull(val: string): number | undefined {
  if (!val?.trim() || val.trim() === "0") return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

function intOrNull(val: string): number | undefined {
  if (!val?.trim() || val.trim() === "0") return undefined;
  const n = parseInt(val);
  return isNaN(n) ? undefined : n;
}

export function mapCSVRow(row: CSVRow): PluginMoviePayload | null {
  // Skip adult content
  if (row.adult?.toLowerCase() === "true") return null;

  const tmdbId = parseInt(row.id);
  if (isNaN(tmdbId)) return null;

  const releaseYear = row.release_date?.length >= 4
    ? parseInt(row.release_date.substring(0, 4))
    : undefined;

  // Genre slugs — skip unknown genres (like "TV Movie")
  const genreSlugs = split(row.genres)
    .map((g) => GENRE_MAP[g])
    .filter((s): s is string => !!s);

  // Language codes — map spoken languages by name
  const langCodes = split(row.spoken_languages)
    .map((name) => LANGUAGE_MAP[name])
    .filter((c): c is string => !!c);

  // If no spoken languages, fall back to original_language (already ISO code)
  if (langCodes.length === 0 && row.original_language?.length === 2) {
    langCodes.push(row.original_language);
  }

  // Companies — just names, no TMDB IDs in CSV
  const companies = split(row.production_companies).slice(0, 5).map((name) => ({
    name,
    role: "production" as const,
  }));

  // Country — pick first, convert to ISO
  const countryRaw = split(row.production_countries)[0];
  const country = countryRaw ? (COUNTRY_MAP[countryRaw] ?? countryRaw.substring(0, 2).toUpperCase()) : undefined;

  // Keywords — cap at 20
  const keywords = split(row.keywords).slice(0, 20);

  // Poster / backdrop — these are TMDB paths, perfect for our ingester
  const posterPath = row.poster_path?.trim() || undefined;
  const backdropPath = row.backdrop_path?.trim() || undefined;

  return {
    title: row.title,
    original_title: row.original_title !== row.title ? row.original_title : undefined,
    tmdb_id: tmdbId,
    imdb_id: row.imdb_id?.trim() || undefined,

    release_year: releaseYear,
    runtime: intOrNull(row.runtime),
    tagline: row.tagline?.trim() || undefined,
    description: row.overview?.trim() || undefined,
    status: mapStatus(row.status),
    origin_country: country,
    original_language: row.original_language?.length === 2 ? row.original_language : undefined,
    budget: intOrNull(row.budget),
    box_office: intOrNull(row.revenue),
    rating_imdb: numOrNull(row.vote_average),
    keywords: keywords.length > 0 ? keywords : undefined,

    tmdb_poster_path: posterPath,
    tmdb_backdrop_path: backdropPath,

    genre_slugs: genreSlugs,
    language_codes: langCodes,
    companies: companies.length > 0 ? companies : undefined,
    // No cast in CSV — will be enriched by Wikidata / TMDB later
    cast: [],
  };
}

export interface TVCSVRow {
  id: string;
  name: string;
  number_of_seasons: string;
  number_of_episodes: string;
  original_language: string;
  vote_count: string;
  vote_average: string;
  overview: string;
  adult: string;
  backdrop_path: string;
  first_air_date: string;
  last_air_date: string;
  homepage: string;
  in_production: string;
  original_name: string;
  popularity: string;
  poster_path: string;
  type: string;
  status: string;
  tagline: string;
  genres: string;
  created_by: string;
  languages: string;
  networks: string;
  origin_country: string;
  spoken_languages: string;
  production_companies: string;
  production_countries: string;
  episode_run_time: string;
}

import type { PluginTVPayload } from "shared-types";

export function mapTVCSVRow(row: TVCSVRow): PluginTVPayload | null {
  if (row.adult?.toLowerCase() === "true") return null;

  const tmdbId = parseInt(row.id);
  if (isNaN(tmdbId)) return null;

  const firstAirYear = row.first_air_date?.length >= 4
    ? parseInt(row.first_air_date.substring(0, 4))
    : undefined;
  
  const lastAirYear = row.last_air_date?.length >= 4
    ? parseInt(row.last_air_date.substring(0, 4))
    : undefined;

  const genreSlugs = split(row.genres)
    .map((g) => GENRE_MAP[g])
    .filter((s): s is string => !!s);

  const langCodes = split(row.spoken_languages)
    .map((name) => LANGUAGE_MAP[name])
    .filter((c): c is string => !!c);

  if (langCodes.length === 0 && row.original_language?.length === 2) {
    langCodes.push(row.original_language);
  }

  const companies = split(row.production_companies).slice(0, 5).map((name) => ({
    name,
    role: "production" as const,
  }));
  
  // also add networks as production companies for TV
  const networks = split(row.networks).slice(0, 3).map((name) => ({
    name,
    role: "production" as const,
  }));
  
  const combinedCompanies = [...companies, ...networks];

  const countryRaw = split(row.production_countries)[0] || split(row.origin_country)[0];
  const country = countryRaw ? (COUNTRY_MAP[countryRaw] ?? countryRaw.substring(0, 2).toUpperCase()) : undefined;

  const posterPath = row.poster_path?.trim() || undefined;
  const backdropPath = row.backdrop_path?.trim() || undefined;
  
  const episodeRunTime = split(row.episode_run_time)[0];

  return {
    title: row.name,
    original_title: row.original_name !== row.name ? row.original_name : undefined,
    tmdb_id: tmdbId,

    first_air_date: row.first_air_date?.trim() || undefined,
    last_air_date: row.last_air_date?.trim() || undefined,
    runtime_per_episode: intOrNull(episodeRunTime),
    season_count: intOrNull(row.number_of_seasons),
    episode_count: intOrNull(row.number_of_episodes),
    
    tagline: row.tagline?.trim() || undefined,
    description: row.overview?.trim() || undefined,
    status: mapTVStatus(row.status),
    origin_country: country,
    original_language: row.original_language?.length === 2 ? row.original_language : undefined,
    rating_imdb: numOrNull(row.vote_average),

    tmdb_poster_path: posterPath,
    tmdb_backdrop_path: backdropPath,

    genre_slugs: genreSlugs,
    language_codes: langCodes,
    companies: combinedCompanies.length > 0 ? combinedCompanies : undefined,
    cast: [],
  };
}
