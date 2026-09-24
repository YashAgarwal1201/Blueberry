// src/types.ts/index.ts

// ── Route param interfaces ────────────────────────────────────────────────────
export interface IdParam {
  id: string;
}
export interface UuidParam {
  uuid: string;
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
  | "editor"
  | "creator";
export type CompanyType = "production" | "distribution" | "streaming";
export type MovieStatus =
  | "released"
  | "upcoming"
  | "in_production"
  | "cancelled";
export type TVStatus = 
  | "returning_series"
  | "planned"
  | "in_production"
  | "ended"
  | "canceled"
  | "pilot";
export type MediaType = 'movie' | 'tv';

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
  uuid: string;
  name: string;
  also_known_as?: string;
  bio?: string;
  birth_date?: string;
  birth_place?: string;
  profile_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
  death_date?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'not_specified';
  known_for_department?: string;
  wikidata_id?: string;
  homepage?: string;
  popularity?: number;
  tmdb_profile_path?: string;
  local_profile_url?: string;
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
  tmdb_logo_path?: string;
  created_at: string;
}

export interface MovieCompany extends Company {
  role: CompanyType;
}

// ── Media Unified Shapes ──────────────────────────────────────────────────────

/**
 * Universal media card used in lists (Home, Search, Trending).
 */
export interface MediaCard {
  id: number;
  uuid: string;
  type: MediaType;
  title: string;
  description?: string;
  poster_url?: string;
  backdrop_url?: string;
  release_year?: number;
  age_rating?: string;
  runtime?: number;
  status: MovieStatus | TVStatus;
  tmdb_id?: number;
  in_watchlist: boolean;
  genres?: Pick<Genre, "id" | "name" | "slug">[];
}

/**
 * Specifically typed cards if needed
 */
export interface MovieCard extends MediaCard {
  type: 'movie';
  runtime?: number;
  rating_imdb?: number;
  age_rating?: string;
  languages: Pick<Language, "id" | "name" | "code">[];
  genres: Pick<Genre, "id" | "name" | "slug">[];
}

export interface TVShowCard extends MediaCard {
  type: 'tv';
  genres: Pick<Genre, "id" | "name" | "slug">[];
}

// ── Movie shapes ──────────────────────────────────────────────────────────────

export interface Movie {
  id: number;
  uuid: string;
  type: 'movie';
  title: string;
  tagline?: string;
  description?: string;
  status: MovieStatus;
  release_year?: number;
  runtime?: number;
  origin_country?: string;
  original_language?: string;
  age_rating?: string;
  imdb_id?: string;
  tmdb_id?: number;
  letterboxd_id?: string;
  wikidata_id?: string;
  rottentomatoes_id?: string;
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string;
  budget?: number;
  box_office?: number;
  rating_imdb?: number;
  rating_rt?: number;
  rating_metacritic?: number;
  tmdb_poster_path?: string;
  tmdb_backdrop_path?: string;
  tmdb_trailer_key?: string;
  local_poster_url?: string;
  local_backdrop_url?: string;
  image_source?: 'tmdb' | 'local' | 'custom';
  spoken_languages?: string[];
  production_countries?: string[];
  keywords?: string[];
  content_advisory?: string;
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

// ── TV Show shapes ─────────────────────────────────────────────────────────────

export interface TVShow {
  id: number;
  uuid: string;
  type: 'tv';
  title: string;
  description?: string;
  status: TVStatus;
  first_air_date?: string;
  last_air_date?: string;
  poster_url?: string;
  backdrop_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
  letterboxd_id?: string;
  network?: string;
  tagline?: string;
  origin_country?: string;
  original_language?: string;
  age_rating?: string;
  keywords?: string[];
  wikidata_id?: string;
  rating_imdb?: number;
  rating_rt?: number;
  rating_metacritic?: number;
  episode_count?: number;
  season_count?: number;
  runtime_per_episode?: number;
  budget?: number;
  box_office?: number;
  tmdb_poster_path?: string;
  tmdb_backdrop_path?: string;
  image_source?: 'tmdb' | 'local' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface TVSeason {
  id: number;
  uuid: string;
  show_id: number;
  season_number: number;
  title: string;
  overview?: string;
  poster_url?: string;
  episode_count: number;
  air_date?: string;
  tmdb_id?: number;
  tmdb_poster_path?: string;
}

export interface TVEpisode {
  id: number;
  uuid: string;
  season_id: number;
  show_id: number;
  episode_number: number;
  title: string;
  overview?: string;
  air_date?: string;
  runtime?: number;
  still_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
  tmdb_still_path?: string;
}

export interface TVShowWithDetails extends TVShow {
  in_watchlist: boolean;
  seasons: TVSeason[];
  languages: Language[];
  genres: Genre[];
  cast: CastMember[];
  companies: Company[];
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
  movie_id?: number;
  show_id?: number;
  status: WatchlistStatus;
  added_at: string;
  updated_at: string;
  watched_at?: string;
  notes?: string;
  user_rating?: number;
  liked?: boolean;
  review_text?: string;
  watch_count: number;
  last_watched_at?: string;
  source?: 'manual' | 'recommendation' | 'search' | 'collection';
}

export interface WatchlistItemWithMovie extends WatchlistItem {
  movie: MovieCard;
}

export interface WatchlistItemWithShow extends WatchlistItem {
  show: TVShowCard;
}

export type WatchlistPopulatedItem = WatchlistItemWithMovie | WatchlistItemWithShow;

export interface WatchlistStats {
  total: number;
  want_to_watch: number;
  watching: number;
  watched: number;
  total_runtime_watched: number;
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

export type CollectionPrivacy = 'private' | 'public' | 'unlisted';

export interface Collection {
  id: number;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  poster_url?: string;
  privacy: CollectionPrivacy;
  item_count: number;
  created_at: string;
}

export interface CollectionDetail extends Collection {
  items: MediaCard[];
}

// ── Home payload (for /home) ──────────────────────────────────────────────────
export interface HomePayload {
  recent: MediaCard[];
  top_rated: MediaCard[];
  hot: MediaCard[];
  watchlist_preview: WatchlistItemWithMovie[]; // We might need to make this generic later if TV shows are in watchlist
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
  imdb_id?: string;
  tmdb_id?: number;
  letterboxd_id?: string;
  wikidata_id?: string;
  rottentomatoes_id?: string;
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
  spoken_languages?: string[];
  production_countries?: string[];
  keywords?: string[];
  content_advisory?: string;
  cast?: CastMemberRequest[];
  companies?: CompanyRequest[];
}

export type UpdateMovieRequest = Partial<CreateMovieRequest>;

export interface AddToWatchlistRequest {
  movie_id?: number;
  show_id?: number;
  status?: WatchlistStatus;
  notes?: string;
  user_rating?: number;
  liked?: boolean;
  review_text?: string;
  watch_count?: number;
  last_watched_at?: string;
  source?: 'manual' | 'recommendation' | 'search' | 'collection';
}

export interface UpdateWatchlistRequest {
  status?: WatchlistStatus;
  notes?: string;
  watched_at?: string;
  user_rating?: number;
  liked?: boolean;
  review_text?: string;
  watch_count?: number;
  last_watched_at?: string;
  source?: 'manual' | 'recommendation' | 'search' | 'collection';
}

export interface CreateTVShowRequest {
  title: string;
  tagline?: string;
  description?: string;
  status?: TVStatus;
  first_air_date?: string;
  last_air_date?: string;
  network?: string;
  origin_country?: string;
  original_language?: string;
  age_rating?: string;
  imdb_id?: string;
  tmdb_id?: number;
  letterboxd_id?: string;
  wikidata_id?: string;
  poster_url?: string;
  backdrop_url?: string;
  budget?: number;
  box_office?: number;
  rating_imdb?: number;
  rating_rt?: number;
  rating_metacritic?: number;
  episode_count?: number;
  season_count?: number;
  runtime_per_episode?: number;
  language_ids?: number[];
  genre_ids?: number[];
  keywords?: string[];
  cast?: CastMemberRequest[];
  companies?: CompanyRequest[];
}

export type UpdateTVShowRequest = Partial<CreateTVShowRequest>;

export interface CreatePersonRequest {
  name: string;
  also_known_as?: string;
  bio?: string;
  birth_date?: string;
  birth_place?: string;
  profile_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
  death_date?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'not_specified';
  known_for_department?: string;
  wikidata_id?: string;
  homepage?: string;
  popularity?: number;
  known_for?: { movie_id?: number; show_id?: number; display_order?: number }[];
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
  privacy?: CollectionPrivacy;
}

export type UpdateCollectionRequest = Partial<CreateCollectionRequest>;

// ── Query param helpers ───────────────────────────────────────────────────────
export interface MovieListQuery {
  page?: string;
  limit?: string;
  sort?: "recent" | "title" | "year" | "rating";
  language?: string;
  genre?: string;
  year?: string;
  status?: MovieStatus;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

// A single language-grouped row inside a genre page
export interface GenreSection {
  language: {
    id: number
    name: string
    code: string
    native_script?: string | null
  }
  movies: MovieCard[]
}

// A single genre-grouped row inside a language page
export interface LanguageSection {
  genre: {
    id: number
    name: string
    slug: string
    description?: string | null
  }
  movies: MovieCard[]
}

export interface PeopleMoviesQuery extends PaginationQuery {
  role?: CastRole;
}

// ── Plugin Contract ───────────────────────────────────────────────────────────
export interface PluginCastPayload {
  name: string
  tmdb_id?: number
  imdb_id?: string
  role: CastRole
  character?: string
  display_order?: number
  tmdb_profile_path?: string
}

export interface PluginCompanyPayload {
  name: string
  tmdb_id?: number
  role: CompanyType
}

export interface PluginMoviePayload {
  // Identity
  title: string
  original_title?: string
  tmdb_id?: number
  imdb_id?: string
  wikidata_id?: string
  letterboxd_id?: string

  // Metadata
  release_year?: number
  runtime?: number
  tagline?: string
  description?: string
  status?: MovieStatus
  age_rating?: string
  origin_country?: string
  original_language?: string
  keywords?: string[]
  budget?: number
  box_office?: number

  // Ratings
  rating_imdb?: number
  rating_rt?: number
  rating_metacritic?: number

  // Assets (paths, not full URLs)
  tmdb_poster_path?: string
  tmdb_backdrop_path?: string
  tmdb_trailer_key?: string   // YouTube video key

  // Relationships
  genre_slugs?: string[]      // resolved against genres table
  language_codes?: string[]   // resolved against languages table
  cast?: PluginCastPayload[]
  companies?: PluginCompanyPayload[]
}

export interface PluginTVPayload {
  // Identity
  title: string
  original_title?: string
  tmdb_id?: number
  imdb_id?: string
  wikidata_id?: string

  // Metadata
  tagline?: string
  description?: string
  status?: TVStatus
  first_air_date?: string
  last_air_date?: string
  network?: string
  origin_country?: string
  original_language?: string
  age_rating?: string
  keywords?: string[]
  episode_count?: number
  season_count?: number
  runtime_per_episode?: number
  budget?: number
  box_office?: number

  // Ratings
  rating_imdb?: number
  rating_rt?: number
  rating_metacritic?: number

  // Assets (TMDB paths)
  tmdb_poster_path?: string
  tmdb_backdrop_path?: string

  // Relationships
  genre_slugs?: string[]
  language_codes?: string[]
  cast?: PluginCastPayload[]
  companies?: PluginCompanyPayload[]
}

export interface IngestResult {
  action: 'created' | 'updated' | 'skipped'
  id: number
  uuid: string
  title: string
  media_type: MediaType
}
