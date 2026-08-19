// src/types.ts/index.ts

// ── Route param interfaces ────────────────────────────────────────────────────
export interface IdParam {
  id: string;
}
export interface MovieIdParam {
  movieId: string;
}
export interface CodeParam {
  code: string;
}
export interface SlugParam {
  slug: string;
}

// ── Enums / literals ─────────────────────────────────────────────────────────
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

// ── Base entities ─────────────────────────────────────────────────────────────
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
  character?: string;
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
  role: CompanyType;
}

// ── Movie shapes ──────────────────────────────────────────────────────────────

/**
 * Lightweight shape — used in all list/grid views.
 * Never includes cast or companies.
 */
export interface MovieCard {
  id: number;
  title: string;
  poster_url?: string;
  backdrop_url?: string;
  release_year?: number;
  runtime?: number;
  rating_imdb?: number;
  age_rating?: string;
  status: MovieStatus;
  in_watchlist: boolean;
  languages: Pick<Language, "id" | "name" | "code">[];
  genres: Pick<Genre, "id" | "name" | "slug">[];
}

/**
 * Full shape — used only on the single movie detail page.
 */
export interface Movie {
  id: number;
  title: string;
  tagline?: string;
  description?: string;
  status: MovieStatus;
  release_year?: number;
  runtime?: number;
  origin_country?: string;
  original_language?: string;
  age_rating?: string;
  director?: string;
  imdb_id?: string;
  tmdb_id?: number;
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string;
  budget?: number;
  box_office?: number;
  rating_imdb?: number;
  rating_rt?: number;
  rating_metacritic?: number;
  created_at: string;
  updated_at: string;
}

export interface MovieWithDetails extends Movie {
  in_watchlist: boolean;
  languages: Language[];
  genres: Genre[];
  cast: CastMember[];
  companies: MovieCompany[];
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ── Watchlist ─────────────────────────────────────────────────────────────────
export interface WatchlistItem {
  id: number;
  movie_id: number;
  status: WatchlistStatus;
  added_at: string;
  updated_at: string;
  watched_at?: string;
  notes?: string;
}

export interface WatchlistItemWithMovie extends WatchlistItem {
  movie: MovieCard;
}

export interface WatchlistStats {
  total: number;
  want_to_watch: number;
  watching: number;
  watched: number;
  total_runtime_watched: number; // sum of runtime for all 'watched' movies, in minutes
}

// ── Genre with movies (for /genres/browse) ────────────────────────────────────
export interface GenreWithMovies extends Genre {
  movie_count: number;
  movies: MovieCard[];
}

// ── Language with movies (for /languages/browse) ──────────────────────────────
export interface LanguageWithMovies extends Language {
  movie_count: number;
  movies: MovieCard[];
}

// ── Person detail (for /people/:id) ──────────────────────────────────────────
export interface PersonDetail extends Person {
  movie_count: number;
  roles: { role: CastRole; count: number }[];
}

// ── Collections ───────────────────────────────────────────────────────────────
export interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  poster_url?: string;
  movie_count: number;
  created_at: string;
}

export interface CollectionDetail extends Collection {
  movies: MovieCard[];
}

// ── Home payload (for /home) ──────────────────────────────────────────────────
export interface HomePayload {
  recent: MovieCard[];
  top_rated: MovieCard[];
  hot: MovieCard[];
  watchlist_preview: WatchlistItemWithMovie[];
  genres: Pick<Genre, "id" | "name" | "slug">[];
  languages: Pick<Language, "id" | "name" | "code">[];
}

// ── Request bodies ────────────────────────────────────────────────────────────
export interface CastMemberRequest {
  person_id?: number;
  name: string;
  profile_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
  role: CastRole;
  character?: string;
  display_order?: number;
}

export interface CompanyRequest {
  company_id?: number;
  name: string;
  type?: CompanyType;
  logo_url?: string;
  country?: string;
  role: CompanyType;
}

export interface CreateMovieRequest {
  title: string;
  tagline?: string;
  description?: string;
  status?: MovieStatus;
  release_year?: number;
  runtime?: number;
  origin_country?: string;
  original_language?: string;
  age_rating?: string;
  director?: string;
  imdb_id?: string;
  tmdb_id?: number;
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string;
  budget?: number;
  box_office?: number;
  rating_imdb?: number;
  rating_rt?: number;
  rating_metacritic?: number;
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

export interface CreateGenreRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface CreateCollectionRequest {
  name: string;
  slug: string;
  description?: string;
  poster_url?: string;
}

export type UpdateCollectionRequest = Partial<CreateCollectionRequest>;

// ── Query param helpers ───────────────────────────────────────────────────────
export interface MovieListQuery {
  page?: string;
  limit?: string;
  sort?: "recent" | "title" | "year" | "rating";
  language?: string; // language code, e.g. "hi"
  genre?: string; // genre slug, e.g. "action"
  year?: string;
  status?: MovieStatus;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PeopleMoviesQuery extends PaginationQuery {
  role?: CastRole;
}
