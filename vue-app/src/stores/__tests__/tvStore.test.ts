import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTvStore } from '../tvStore'
import apiClient from '@/services/apiInterceptors'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('tvStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes correctly', () => {
    const store = useTvStore()
    expect(store.recentShows).toEqual([])
    expect(store.topRatedShows).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetches recent shows', async () => {
    const store = useTvStore()
    const mockShows = [{ uuid: '1', title: 'Show 1' }]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockShows } })

    const result = await store.fetchRecentShows()
    
    expect(apiClient.get).toHaveBeenCalledWith('tv/recent')
    expect(store.recentShows).toEqual(mockShows)
    expect(result).toEqual(mockShows)
    expect(store.loading).toBe(false)
  })

  it('fetches top rated shows', async () => {
    const store = useTvStore()
    const mockShows = [{ uuid: '2', title: 'Show 2' }]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockShows } })

    const result = await store.fetchTopRatedShows()
    
    expect(apiClient.get).toHaveBeenCalledWith('tv/top-rated')
    expect(store.topRatedShows).toEqual(mockShows)
    expect(result).toEqual(mockShows)
  })

  it('fetches show by id', async () => {
    const store = useTvStore()
    const mockShow = { uuid: '123', title: 'Details' }
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockShow } })

    const result = await store.fetchShowById('123')
    
    expect(apiClient.get).toHaveBeenCalledWith('tv/123')
    expect(result).toEqual(mockShow)
  })

  it('removes show locally', () => {
    const store = useTvStore()
    store.recentShows = [{ uuid: '1' } as any, { uuid: '2' } as any]
    store.topRatedShows = [{ uuid: '1' } as any]
    
    store.removeShowLocally('1')
    
    expect(store.recentShows).toHaveLength(1)
    expect(store.recentShows[0].uuid).toBe('2')
    expect(store.topRatedShows).toHaveLength(0)
  })
})
