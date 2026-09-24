const TMDB_BASE = 'https://image.tmdb.org/t/p'
const TMDB_YOUTUBE_BASE = 'https://www.youtube.com/watch?v='

export type TmdbImageSize = 'w92' | 'w154' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'h632' | 'original'

export function tmdbImage(path: string | null | undefined, size: TmdbImageSize = 'w500'): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path  // already a full URL (custom/local)
  return `${TMDB_BASE}/${size}${path}`
}

export function tmdbYoutube(key: string | null | undefined): string | null {
  if (!key) return null
  return `${TMDB_YOUTUBE_BASE}${key}`
}

export function resolveImage(
  tmdbPath: string | null | undefined,
  localUrl: string | null | undefined,
  size: TmdbImageSize = 'w500'
): string | null {
  if (tmdbPath) return tmdbImage(tmdbPath, size)
  if (localUrl) return localUrl
  return null
}
