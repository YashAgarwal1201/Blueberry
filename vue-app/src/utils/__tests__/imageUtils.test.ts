import { describe, it, expect } from 'vitest'
import { tmdbImage, tmdbYoutube, resolveImage } from '../imageUtils'

describe('imageUtils', () => {
  describe('tmdbImage', () => {
    it('returns null for null, undefined, or empty path', () => {
      expect(tmdbImage(null)).toBeNull()
      expect(tmdbImage(undefined)).toBeNull()
      expect(tmdbImage('')).toBeNull()
    })

    it('returns original path if it already starts with http/https', () => {
      expect(tmdbImage('https://custom.cdn.com/image.jpg')).toBe('https://custom.cdn.com/image.jpg')
      expect(tmdbImage('http://localhost:3000/poster.png')).toBe('http://localhost:3000/poster.png')
    })

    it('formats TMDB image URL with default and custom sizes', () => {
      expect(tmdbImage('/path123.jpg')).toBe('https://image.tmdb.org/t/p/w500/path123.jpg')
      expect(tmdbImage('/path123.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/path123.jpg')
      expect(tmdbImage('/path123.jpg', 'w185')).toBe('https://image.tmdb.org/t/p/w185/path123.jpg')
    })
  })

  describe('tmdbYoutube', () => {
    it('returns null for null, undefined, or empty key', () => {
      expect(tmdbYoutube(null)).toBeNull()
      expect(tmdbYoutube(undefined)).toBeNull()
      expect(tmdbYoutube('')).toBeNull()
    })

    it('formats YouTube watch URL with key', () => {
      expect(tmdbYoutube('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    })
  })

  describe('resolveImage', () => {
    it('prefers TMDB path when provided', () => {
      expect(resolveImage('/poster.jpg', 'https://local.org/img.png')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
    })

    it('falls back to local URL when TMDB path is absent', () => {
      expect(resolveImage(null, 'https://local.org/img.png')).toBe('https://local.org/img.png')
      expect(resolveImage(undefined, 'https://local.org/img.png')).toBe('https://local.org/img.png')
    })

    it('returns null when neither is provided', () => {
      expect(resolveImage(null, null)).toBeNull()
      expect(resolveImage(undefined, undefined)).toBeNull()
    })
  })
})
