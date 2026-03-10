// src/types/movies.ts

// export type WatchlistStatus = 'want_to_watch' | 'watching' | 'watched'
// export type CastRole =
//   | 'actor'
//   | 'director'
//   | 'writer'
//   | 'producer'
//   | 'cinematographer'
//   | 'composer'
//   | 'editor'
// export type CompanyType = 'production' | 'distribution' | 'streaming'
// export type MovieStatus = 'released' | 'upcoming' | 'in_production' | 'cancelled'

// export interface Language {
//   id: number
//   name: string
//   code: string
//   native_script?: string
// }

// export interface Genre {
//   id: number
//   name: string
//   slug: string
//   description?: string
//   created_at: string
// }

// export interface Person {
//   id: number
//   name: string
//   also_known_as?: string
//   bio?: string
//   birth_date?: string
//   birth_place?: string
//   profile_url?: string
//   tmdb_id?: number
//   imdb_id?: string
//   created_at: string
// }

// export interface CastMember extends Person {
//   role: CastRole
//   character?: string
//   display_order: number
// }

// export interface Company {
//   id: number
//   name: string
//   type: CompanyType
//   logo_url?: string
//   country?: string
//   tmdb_id?: number
//   created_at: string
// }

// export interface MovieCompany extends Company {
//   role: CompanyType
// }

// export interface Movie {
//   id: number
//   title: string
//   tagline?: string
//   description?: string
//   status: MovieStatus
//   release_year?: number
//   runtime?: number
//   origin_country?: string
//   original_language?: string
//   age_rating?: string
//   director?: string
//   imdb_id?: string
//   tmdb_id?: number
//   poster_url?: string
//   backdrop_url?: string
//   trailer_url?: string
//   budget?: number
//   box_office?: number
//   rating_imdb?: number
//   rating_rt?: number
//   rating_metacritic?: number
//   created_at: string
//   updated_at: string
// }

// export interface MovieWithDetails extends Movie {
//   languages: Language[]
//   genres: Genre[]
//   cast: CastMember[]
//   companies: MovieCompany[]
// }

// // Keep this alias so existing store/component code doesn't break
// export type MovieWithLanguages = MovieWithDetails

// export interface WatchlistItem {
//   id: number
//   movie_id: number
//   status: WatchlistStatus
//   added_at: string
//   watched_at?: string
//   notes?: string
// }

// export interface WatchlistItemWithMovie extends WatchlistItem {
//   movie: MovieWithDetails
// }

// export interface CastMemberRequest {
//   person_id?: number
//   name: string
//   profile_url?: string
//   tmdb_id?: number
//   imdb_id?: string
//   role: CastRole
//   character?: string
//   display_order?: number
// }

// export interface CompanyRequest {
//   company_id?: number
//   name: string
//   type?: CompanyType
//   logo_url?: string
//   country?: string
//   role: CompanyType
// }

// export interface CreateMovieRequest {
//   title: string
//   tagline?: string
//   description?: string
//   status?: MovieStatus
//   release_year?: number
//   runtime?: number
//   origin_country?: string
//   original_language?: string
//   age_rating?: string
//   director?: string
//   imdb_id?: string
//   tmdb_id?: number
//   poster_url?: string
//   backdrop_url?: string
//   trailer_url?: string
//   budget?: number
//   box_office?: number
//   rating_imdb?: number
//   rating_rt?: number
//   rating_metacritic?: number
//   language_ids?: number[]
//   genre_ids?: number[]
//   cast?: CastMemberRequest[]
//   companies?: CompanyRequest[]
// }

// export type UpdateMovieRequest = Partial<CreateMovieRequest>

// export interface AddToWatchlistRequest {
//   movie_id: number
//   status: WatchlistStatus
//   notes?: string
// }

// export interface UpdateWatchlistRequest {
//   status?: WatchlistStatus
//   notes?: string
//   watched_at?: string
// }

// v2 - mar 9, 2026

// ── Enums / literals ─────────────────────────────────────────────────────────
export type WatchlistStatus = 'want_to_watch' | 'watching' | 'watched'
export type CastRole =
  | 'actor'
  | 'director'
  | 'writer'
  | 'producer'
  | 'cinematographer'
  | 'composer'
  | 'editor'
export type CompanyType = 'production' | 'distribution' | 'streaming'
export type MovieStatus = 'released' | 'upcoming' | 'in_production' | 'cancelled'

// ── Base entities ─────────────────────────────────────────────────────────────
export interface Language {
  id: number
  name: string
  code: string
  native_script?: string
}

export interface Genre {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
}

export interface Person {
  id: number
  name: string
  also_known_as?: string
  bio?: string
  birth_date?: string
  birth_place?: string
  profile_url?: string
  tmdb_id?: number
  imdb_id?: string
  created_at: string
}

export interface CastMember extends Person {
  role: CastRole
  character?: string
  display_order: number
}

export interface Company {
  id: number
  name: string
  type: CompanyType
  logo_url?: string
  country?: string
  tmdb_id?: number
  created_at: string
}

export interface MovieCompany extends Company {
  role: CompanyType
}

// ── Movie ─────────────────────────────────────────────────────────────────────
export interface Movie {
  id: number
  title: string
  tagline?: string
  description?: string
  status: MovieStatus
  release_year?: number
  runtime?: number
  origin_country?: string
  original_language?: string
  age_rating?: string
  director?: string
  imdb_id?: string
  tmdb_id?: number
  poster_url?: string
  backdrop_url?: string
  trailer_url?: string
  budget?: number
  box_office?: number
  rating_imdb?: number
  rating_rt?: number
  rating_metacritic?: number
  created_at: string
  updated_at: string
}

export interface MovieWithDetails extends Movie {
  languages: Language[]
  genres: Genre[]
  cast: CastMember[]
  companies: MovieCompany[]
}

// Keep alias so existing store references don't break during migration
export type MovieWithLanguages = MovieWithDetails

// ── Watchlist ─────────────────────────────────────────────────────────────────
export interface WatchlistItem {
  id: number
  movie_id: number
  status: WatchlistStatus
  added_at: string
  watched_at?: string
  notes?: string
}

export interface WatchlistItemWithMovie extends WatchlistItem {
  movie: MovieWithDetails
}

// ── Request bodies ────────────────────────────────────────────────────────────
export interface CastMemberRequest {
  person_id?: number
  name: string
  profile_url?: string
  tmdb_id?: number
  imdb_id?: string
  role: CastRole
  character?: string
  display_order?: number
}

export interface CompanyRequest {
  company_id?: number
  name: string
  type?: CompanyType
  logo_url?: string
  country?: string
  role: CompanyType
}

export interface CreateMovieRequest {
  title: string
  tagline?: string
  description?: string
  status?: MovieStatus
  release_year?: number
  runtime?: number
  origin_country?: string
  original_language?: string
  age_rating?: string
  director?: string
  imdb_id?: string
  tmdb_id?: number
  poster_url?: string
  backdrop_url?: string
  trailer_url?: string
  budget?: number
  box_office?: number
  rating_imdb?: number
  rating_rt?: number
  rating_metacritic?: number
  language_ids?: number[]
  genre_ids?: number[]
  cast?: CastMemberRequest[]
  companies?: CompanyRequest[]
}

export type UpdateMovieRequest = Partial<CreateMovieRequest>

export interface AddToWatchlistRequest {
  movie_id: number
  status: WatchlistStatus
  notes?: string
}

export interface UpdateWatchlistRequest {
  status?: WatchlistStatus
  notes?: string
  watched_at?: string
}

export interface CreatePersonRequest {
  name: string
  also_known_as?: string
  bio?: string
  birth_date?: string
  birth_place?: string
  profile_url?: string
  tmdb_id?: number
  imdb_id?: string
}

export interface CreateCompanyRequest {
  name: string
  type?: CompanyType
  logo_url?: string
  country?: string
  tmdb_id?: number
}
