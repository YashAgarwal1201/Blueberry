import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWatchlistStore } from '../watchListStore'
import apiClient from '@/services/apiInterceptors'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

describe('watchlistStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useWatchlistStore()
    expect(store.items).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetches watchlist successfully', async () => {
    const store = useWatchlistStore()
    const mockItems = [
      { id: 1, movie_id: 10, status: 'want_to_watch', movie: { title: 'Movie 10' } },
      { id: 2, movie_id: 20, status: 'watched', movie: { title: 'Movie 20' } }
    ]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: { items: mockItems } } })

    const result = await store.fetchWatchlist()
    
    expect(apiClient.get).toHaveBeenCalledWith('/watchlist')
    expect(store.items).toEqual(mockItems)
    expect(result).toEqual(mockItems)
    expect(store.wantToWatch).toHaveLength(1)
    expect(store.watched).toHaveLength(1)
    expect(store.isMovieInWatchlist(10)).toBe(true)
    expect(store.isMovieInWatchlist(99)).toBe(false)
  })

  it('adds movie to watchlist successfully', async () => {
    const store = useWatchlistStore()
    const newItem = { id: 3, movie_id: 30, status: 'watching' }
    
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { data: newItem } })

    const result = await store.addMovieToWatchlist(30, 'watching')
    
    expect(apiClient.post).toHaveBeenCalledWith('/watchlist', {
      movie_id: 30,
      status: 'watching'
    })
    expect(store.items).toContainEqual(newItem)
    expect(result).toEqual(newItem)
  })

  it('updates status successfully', async () => {
    const store = useWatchlistStore()
    store.items = [{ id: 1, movie_id: 10, status: 'want_to_watch' } as any]
    
    const updatedItem = { id: 1, movie_id: 10, status: 'watched' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { data: updatedItem } })

    const result = await store.updateStatus(1, 'watched')
    
    expect(apiClient.patch).toHaveBeenCalledWith('/watchlist/1', { status: 'watched' })
    expect(store.items[0].status).toBe('watched')
    expect(result).toEqual(updatedItem)
  })

  it('removes from watchlist successfully', async () => {
    const store = useWatchlistStore()
    store.items = [{ id: 1, movie_id: 10, status: 'want_to_watch' } as any]
    
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})

    const result = await store.removeFromWatchlist(1)
    
    expect(apiClient.delete).toHaveBeenCalledWith('/watchlist/1')
    expect(store.items).toHaveLength(0)
    expect(result).toBe(true)
  })
})
