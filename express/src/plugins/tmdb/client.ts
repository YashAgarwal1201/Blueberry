/**
 * tmdb/client.ts
 *
 * Thin wrapper around the TMDB API v3.
 * All methods return raw TMDB response shapes.
 * The mapper is responsible for converting these to plugin payloads.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

if (!API_KEY) {
  console.warn("[tmdb] TMDB_API_KEY not set — TMDB plugin disabled");
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) throw new Error("TMDB_API_KEY is not configured");

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status} for ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Raw TMDB shapes (trimmed to what we use) ──────────────────────────────────

export interface TMDBGenre { id: number; name: string }
export interface TMDBSpokenLanguage { iso_639_1: string; english_name: string; name: string }
export interface TMDBProductionCountry { iso_3166_1: string; name: string }
export interface TMDBProductionCompany { id: number; name: string; logo_path: string | null; origin_country: string }
export interface TMDBCastMember {
  id: number
  name: string
  character: string
  known_for_department: string
  profile_path: string | null
  order: number
  credit_id: string
}
export interface TMDBCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
  credit_id: string
}
export interface TMDBVideoResult {
  key: string
  site: string
  type: string
  official: boolean
}

export interface TMDBMovieDetails {
  id: number
  title: string
  original_title: string
  tagline: string | null
  overview: string | null
  status: string
  release_date: string
  runtime: number | null
  budget: number
  revenue: number
  vote_average: number
  genres: TMDBGenre[]
  spoken_languages: TMDBSpokenLanguage[]
  production_countries: TMDBProductionCountry[]
  production_companies: TMDBProductionCompany[]
  poster_path: string | null
  backdrop_path: string | null
  imdb_id: string | null
  // append_to_response fields
  credits?: {
    cast: TMDBCastMember[]
    crew: TMDBCrewMember[]
  }
  videos?: {
    results: TMDBVideoResult[]
  }
  keywords?: {
    keywords: { id: number; name: string }[]
  }
  external_ids?: {
    imdb_id: string | null
    wikidata_id: string | null
  }
}

export interface TMDBTVDetails {
  id: number
  name: string
  original_name: string
  tagline: string | null
  overview: string | null
  status: string
  first_air_date: string
  last_air_date: string
  number_of_episodes: number
  number_of_seasons: number
  episode_run_time: number[]
  vote_average: number
  genres: TMDBGenre[]
  spoken_languages: TMDBSpokenLanguage[]
  origin_country: string[]
  original_language: string
  networks: { id: number; name: string; logo_path: string | null }[]
  production_companies: TMDBProductionCompany[]
  poster_path: string | null
  backdrop_path: string | null
  // append_to_response fields
  aggregate_credits?: {
    cast: Array<{
      id: number
      name: string
      profile_path: string | null
      roles: { character: string; episode_count: number; credit_id: string }[]
      known_for_department: string
      order: number
    }>
    crew: Array<{
      id: number
      name: string
      profile_path: string | null
      jobs: { job: string; episode_count: number; credit_id: string }[]
      department: string
    }>
  }
  videos?: { results: TMDBVideoResult[] }
  keywords?: { results: { id: number; name: string }[] }
  external_ids?: { imdb_id: string | null; wikidata_id: string | null }
}

export interface TMDBSearchResult {
  id: number
  media_type: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  poster_path: string | null
  vote_average?: number
}

// ── API methods ───────────────────────────────────────────────────────────────

export const tmdbClient = {
  isConfigured: () => !!API_KEY,

  getMovie(tmdbId: number) {
    return tmdbGet<TMDBMovieDetails>(`/movie/${tmdbId}`, {
      append_to_response: "credits,videos,keywords,external_ids",
    });
  },

  getTV(tmdbId: number) {
    return tmdbGet<TMDBTVDetails>(`/tv/${tmdbId}`, {
      append_to_response: "aggregate_credits,videos,keywords,external_ids",
    });
  },

  searchMulti(query: string) {
    return tmdbGet<{ results: TMDBSearchResult[] }>("/search/multi", {
      query,
      include_adult: "false",
    });
  },

  searchMovies(query: string) {
    return tmdbGet<{ results: TMDBSearchResult[] }>("/search/movie", {
      query,
      include_adult: "false",
    });
  },

  searchTV(query: string) {
    return tmdbGet<{ results: TMDBSearchResult[] }>("/search/tv", {
      query,
      include_adult: "false",
    });
  },

  getPopularMovies(page = 1) {
    return tmdbGet<{ results: TMDBSearchResult[]; total_pages: number }>(
      "/movie/popular", { page: String(page) }
    );
  },

  getTopRatedMovies(page = 1) {
    return tmdbGet<{ results: TMDBSearchResult[]; total_pages: number }>(
      "/movie/top_rated", { page: String(page) }
    );
  },

  getPopularTV(page = 1) {
    return tmdbGet<{ results: TMDBSearchResult[]; total_pages: number }>(
      "/tv/popular", { page: String(page) }
    );
  },

  getTrendingAll(window: 'day' | 'week' = 'week') {
    return tmdbGet<{ results: TMDBSearchResult[] }>(`/trending/all/${window}`);
  },
};
