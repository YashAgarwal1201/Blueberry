// src/types/movie.ts

export interface Language {
  id: number
  name: string
  code: string
}

export interface Movie {
  id: number
  title: string
  description?: string
  release_year?: number
  director?: string
  poster_url?: string
  runtime?: number
  created_at: string
  updated_at: string
}

export interface MovieWithLanguages extends Movie {
  languages: Language[]
}

export type WatchlistStatus = 'want_to_watch' | 'watching' | 'watched'

export interface WatchlistItem {
  id: number
  movie_id: number
  status: WatchlistStatus
  added_at: string
  watched_at?: string
}

export interface WatchlistItemWithMovie extends WatchlistItem {
  movie: MovieWithLanguages
}

// Request types
export interface CreateMovieRequest {
  title: string
  description?: string
  release_year?: number
  director?: string
  poster_url?: string
  runtime?: number
  language_ids?: number[]
}

export interface UpdateMovieRequest {
  title?: string
  description?: string
  release_year?: number
  director?: string
  poster_url?: string
  runtime?: number
  language_ids?: number[]
}

export interface AddToWatchlistRequest {
  movie_id: number
  status: WatchlistStatus
}

export interface UpdateWatchlistRequest {
  status: WatchlistStatus
}
