// src/types/index.ts

export interface Movie {
  id: number;
  title: string;
  description?: string;
  release_year?: number;
  director?: string;
  poster_url?: string;
  runtime?: number;
  created_at: string;
  updated_at: string;
}

export interface Language {
  id: number;
  name: string;
  code: string;
}

export interface MovieWithLanguages extends Movie {
  languages: Language[];
}

export interface WatchlistItem {
  id: number;
  movie_id: number;
  status: "want_to_watch" | "watching" | "watched";
  added_at: string;
  watched_at?: string;
}

export interface WatchlistItemWithMovie extends WatchlistItem {
  movie: MovieWithLanguages;
}

export interface CreateMovieRequest {
  title: string;
  description?: string;
  release_year?: number;
  director?: string;
  poster_url?: string;
  runtime?: number;
  language_ids?: number[];
}

export interface UpdateMovieRequest {
  title?: string;
  description?: string;
  release_year?: number;
  director?: string;
  poster_url?: string;
  runtime?: number;
  language_ids?: number[];
}

export interface AddToWatchlistRequest {
  movie_id: number;
  status: "want_to_watch" | "watching" | "watched";
}

export interface UpdateWatchlistRequest {
  status?: "want_to_watch" | "watching" | "watched";
}
