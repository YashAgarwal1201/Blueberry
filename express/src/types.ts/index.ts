// src/types.ts/index.ts

// Route param interfaces
export interface IdParam {
  id: string;
}
export interface MovieIdParam {
  movieId: string;
}
export interface CodeParam {
  code: string;
}

// ── Enums / literals ────────────────────────────────────────────────────────
export type WatchlistStatus = "want_to_watch" | "watching" | "watched";
export type CastRole =
  | "actor"
  | "director"
  | "writer"
  | "producer"
  | "cinematographer"
  | "composer"
  | "editor";
export type CompanyType = "production" | "distribution" | "streaming";
export type MovieStatus =
  | "released"
  | "upcoming"
  | "in_production"
  | "cancelled";

// ── Base entities ────────────────────────────────────────────────────────────
export interface Language {
  id: number;
  name: string;
  code: string;
  native_script?: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface Person {
  id: number;
  name: string;
  also_known_as?: string;
  bio?: string;
  birth_date?: string;
  birth_place?: string;
  profile_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
  created_at: string;
}

export interface CastMember extends Person {
  role: CastRole;
  character?: string; // for actors
  display_order: number;
}

export interface Company {
  id: number;
  name: string;
  type: CompanyType;
  logo_url?: string;
  country?: string;
  tmdb_id?: number;
  created_at: string;
}

export interface MovieCompany extends Company {
  role: CompanyType; // role in this specific movie
}

// ── Movie ────────────────────────────────────────────────────────────────────
export interface Movie {
  id: number;
  title: string;
  tagline?: string;
  description?: string;
  status: MovieStatus;
  release_year?: number;
  runtime?: number; // minutes
  origin_country?: string; // ISO 3166-1 alpha-2, e.g. "US"
  original_language?: string; // ISO 639-1, e.g. "en"
  age_rating?: string; // "U" | "UA" | "A" | "PG" | "PG-13" | "R" | "NC-17"

  // Key crew (denormalised for quick display)
  director?: string;

  // External IDs
  imdb_id?: string;
  tmdb_id?: number;

  // Media
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string; // YouTube full URL or embed URL

  // Financials (stored in USD)
  budget?: number;
  box_office?: number;

  // Ratings
  rating_imdb?: number; // 0.0 – 10.0
  rating_rt?: number; // 0 – 100 (Tomatometer %)
  rating_metacritic?: number; // 0 – 100

  created_at: string;
  updated_at: string;
}

export interface MovieWithDetails extends Movie {
  languages: Language[];
  genres: Genre[];
  cast: CastMember[];
  companies: MovieCompany[];
}

// ── Watchlist ────────────────────────────────────────────────────────────────
export interface WatchlistItem {
  id: number;
  movie_id: number;
  status: WatchlistStatus;
  added_at: string;
  watched_at?: string;
  notes?: string;
}

export interface WatchlistItemWithMovie extends WatchlistItem {
  movie: MovieWithDetails;
}

// ── Request bodies ────────────────────────────────────────────────────────────
export interface CastMemberRequest {
  person_id?: number; // if person already exists
  name: string; // used to create person if person_id not given
  profile_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
  role: CastRole;
  character?: string;
  display_order?: number;
}

export interface CompanyRequest {
  company_id?: number; // if company already exists
  name: string;
  type?: CompanyType;
  logo_url?: string;
  country?: string;
  role: CompanyType;
}

export interface CreateMovieRequest {
  // Required
  title: string;

  // Basic info
  tagline?: string;
  description?: string;
  status?: MovieStatus;
  release_year?: number;
  runtime?: number;
  origin_country?: string;
  original_language?: string;
  age_rating?: string;

  // Crew (denormalised)
  director?: string;

  // External IDs
  imdb_id?: string;
  tmdb_id?: number;

  // Media
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string;

  // Financials
  budget?: number;
  box_office?: number;

  // Ratings
  rating_imdb?: number;
  rating_rt?: number;
  rating_metacritic?: number;

  // Relations
  language_ids?: number[];
  genre_ids?: number[];
  cast?: CastMemberRequest[];
  companies?: CompanyRequest[];
}

export type UpdateMovieRequest = Partial<CreateMovieRequest>;

export interface AddToWatchlistRequest {
  movie_id: number;
  status: WatchlistStatus;
  notes?: string;
}

export interface UpdateWatchlistRequest {
  status?: WatchlistStatus;
  notes?: string;
  watched_at?: string;
}

export interface CreatePersonRequest {
  name: string;
  also_known_as?: string;
  bio?: string;
  birth_date?: string;
  birth_place?: string;
  profile_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
}

export interface CreateCompanyRequest {
  name: string;
  type?: CompanyType;
  logo_url?: string;
  country?: string;
  tmdb_id?: number;
}
