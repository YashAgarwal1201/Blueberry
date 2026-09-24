import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMoviesStore } from '../moviesStore'
import apiClient from '@/services/apiInterceptors'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('moviesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useMoviesStore()
    expect(store.movies).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.movieCount).toBe(0)
  })

  it('fetches movies successfully', async () => {
    const store = useMoviesStore()
    const mockMovies = [
      { uuid: '1', title: 'Movie 1', release_year: 2021 },
      { uuid: '2', title: 'Movie 2', release_year: 2021 }
    ]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockMovies } })

    const result = await store.fetchMovies()
    
    expect(apiClient.get).toHaveBeenCalledWith('movies')
    expect(store.movies).toEqual(mockMovies)
    expect(result).toEqual(mockMovies)
    expect(store.loading).toBe(false)
    expect(store.movieCount).toBe(2)
    expect(store.moviesByYear.get(2021)).toHaveLength(2)
  })

  it('handles fetch movies error', async () => {
    const store = useMoviesStore()
    const error = new Error('Network Error')
    
    vi.mocked(apiClient.get).mockRejectedValueOnce(error)

    await expect(store.fetchMovies()).rejects.toThrow('Network Error')
    expect(store.error).toBe('Network Error')
    expect(store.loading).toBe(false)
  })

  it('adds a movie successfully', async () => {
    const store = useMoviesStore()
    const newMovie = { uuid: '3', title: 'New Movie' }
    
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { data: newMovie } })

    const result = await store.addMovie({ title: 'New Movie' })
    
    expect(apiClient.post).toHaveBeenCalledWith('movies', { title: 'New Movie' })
    expect(store.movies).toContainEqual(newMovie)
    expect(result).toEqual(newMovie)
  })

  it('updates a movie successfully', async () => {
    const store = useMoviesStore()
    // Initial state
    store.movies = [{ uuid: '1', title: 'Old Title', release_year: 2020 } as any]
    
    const updatedMovie = { uuid: '1', title: 'New Title', release_year: 2020 }
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { data: updatedMovie } })

    const result = await store.updateMovie('1', { title: 'New Title' })
    
    expect(apiClient.put).toHaveBeenCalledWith('movies/1', { title: 'New Title' })
    expect(store.movies[0]!.title).toBe('New Title')
    expect(result).toEqual(updatedMovie)
  })

  it('deletes a movie successfully', async () => {
    const store = useMoviesStore()
    store.movies = [{ uuid: '1', title: 'Movie 1' } as any]
    
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})

    const result = await store.deleteMovie('1')
    
    expect(apiClient.delete).toHaveBeenCalledWith('movies/1')
    expect(store.movies).toHaveLength(0)
    expect(result).toBe(true)
  })

  it('searches movies locally', () => {
    const store = useMoviesStore()
    store.movies = [
      { uuid: '1', title: 'Batman', description: 'Dark knight', genres: [], cast: [] } as any,
      { uuid: '2', title: 'Superman', description: 'Man of steel', genres: [], cast: [] } as any
    ]
    
    const result = store.searchLocal('bat')
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('Batman')
  })
})
