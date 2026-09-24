import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollectionsStore } from '../collectionsStore'
import apiClient from '@/services/apiInterceptors'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('collectionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useCollectionsStore()
    expect(store.myCollections).toEqual([])
    expect(store.communityCollections).toEqual([])
    expect(store.currentCollection).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetches my collections successfully', async () => {
    const store = useCollectionsStore()
    const mockCollections = [
      { id: 1, name: 'Favs', item_count: 0 }
    ]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockCollections } })

    const result = await store.fetchMyCollections()
    
    expect(apiClient.get).toHaveBeenCalledWith('/collections')
    expect(store.myCollections).toEqual(mockCollections)
    expect(result).toEqual(mockCollections)
  })

  it('fetches community collections successfully', async () => {
    const store = useCollectionsStore()
    const mockCollections = [
      { id: 2, name: 'Public List', item_count: 10 }
    ]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockCollections } })

    const result = await store.fetchCommunityCollections()
    
    expect(apiClient.get).toHaveBeenCalledWith('/collections?community=true')
    expect(store.communityCollections).toEqual(mockCollections)
    expect(result).toEqual(mockCollections)
  })

  it('creates collection successfully', async () => {
    const store = useCollectionsStore()
    const newCol = { id: 3, name: 'New Col', slug: 'new-col' }
    
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { data: newCol } })

    const result = await store.createCollection({ name: 'New Col', slug: 'new-col', privacy: 'private' })
    
    expect(apiClient.post).toHaveBeenCalledWith('/collections', { name: 'New Col', slug: 'new-col', privacy: 'private' })
    expect(store.myCollections).toContainEqual(newCol)
    expect(result).toEqual(newCol)
  })

  it('updates collection successfully', async () => {
    const store = useCollectionsStore()
    store.myCollections = [{ id: 1, name: 'Favs', item_count: 0 } as any]
    
    const updated = { id: 1, name: 'Updated Favs', item_count: 0 }
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { data: updated } })

    const result = await store.updateCollection(1, { name: 'Updated Favs' })
    
    expect(apiClient.put).toHaveBeenCalledWith('/collections/1', { name: 'Updated Favs' })
    expect(store.myCollections[0]!.name).toBe('Updated Favs')
    expect(result).toEqual(updated)
  })

  it('adds item to collection successfully', async () => {
    const store = useCollectionsStore()
    store.myCollections = [{ id: 1, name: 'Favs', item_count: 0 } as any]
    
    const updatedDetail = { id: 1, name: 'Favs', item_count: 1, items: [{ title: 'Movie 1' }] }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { data: updatedDetail } })

    const result = await store.addItemToCollection(1, 100, 'movie')
    
    expect(apiClient.post).toHaveBeenCalledWith('/collections/1/items', { movie_id: 100 })
    expect(store.myCollections[0]!.item_count).toBe(1)
    expect(result).toEqual(updatedDetail)
  })

  it('removes item from collection successfully', async () => {
    const store = useCollectionsStore()
    store.myCollections = [{ id: 1, name: 'Favs', item_count: 1 } as any]
    
    const updatedDetail = { id: 1, name: 'Favs', item_count: 0, items: [] }
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { data: updatedDetail } })

    const result = await store.removeItemFromCollection(1, 100, 'movie')
    
    expect(apiClient.delete).toHaveBeenCalledWith('/collections/1/items?movie_id=100')
    expect(store.myCollections[0]!.item_count).toBe(0)
    expect(result).toEqual(updatedDetail)
  })
})
