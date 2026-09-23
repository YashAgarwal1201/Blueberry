import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGenresStore } from '../genresStore'
import { usePreferencesStore } from '../preferencesStore'
import apiClient from '@/services/apiInterceptors'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

vi.mock('../preferencesStore', () => ({
  usePreferencesStore: vi.fn()
}))

describe('genresStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(usePreferencesStore).mockReturnValue({ blockedGenres: ['horror'] } as any)
  })

  it('initializes correctly', () => {
    const store = useGenresStore()
    expect(store.genres).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetches genres and filters visible genres', async () => {
    const store = useGenresStore()
    const mockGenres = [
      { id: 1, name: 'Action', slug: 'action' },
      { id: 2, name: 'Horror', slug: 'horror' }
    ]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockGenres } })

    const result = await store.fetchGenres()
    
    expect(apiClient.get).toHaveBeenCalledWith('/genres')
    expect(store.genres).toEqual(mockGenres)
    expect(result).toEqual(mockGenres)
    
    // Check computed properties
    expect(store.visibleGenres).toHaveLength(1)
    expect(store.visibleGenres[0].name).toBe('Action')
    expect(store.genreMap.get(1)?.name).toBe('Action')
    expect(store.genreBySlug.get('horror')?.name).toBe('Horror')
  })

  it('fetches movies by genre', async () => {
    const store = useGenresStore()
    const mockMovies = [{ title: 'Action Movie' }]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: { movies: mockMovies } } })

    const result = await store.fetchMoviesByGenre('action')
    
    expect(apiClient.get).toHaveBeenCalledWith('/genres/action/movies?sort=recent')
    expect(store.moviesByGenre.get('action')).toEqual(mockMovies)
    expect(result).toEqual(mockMovies)
    expect(store.moviesLoadingMap.get('action')).toBe(false)
  })
})
