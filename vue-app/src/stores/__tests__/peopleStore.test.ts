import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePeopleStore } from '../peopleStore'
import apiClient from '@/services/apiInterceptors'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('peopleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes correctly', () => {
    const store = usePeopleStore()
    expect(store.people).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.creating).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetches people', async () => {
    const store = usePeopleStore()
    const mockPeople = [{ id: 1, name: 'John Doe' }]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockPeople } })

    const result = await store.fetchPeople()
    
    expect(apiClient.get).toHaveBeenCalledWith('people')
    expect(store.people).toEqual(mockPeople)
    expect(result).toEqual(mockPeople)
    expect(store.loading).toBe(false)
  })

  it('creates a person', async () => {
    const store = usePeopleStore()
    const newPerson = { id: 2, name: 'Jane Doe' }
    
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { data: newPerson } })

    const result = await store.createPerson({ name: 'Jane Doe' })
    
    expect(apiClient.post).toHaveBeenCalledWith('people', { name: 'Jane Doe' })
    expect(store.people).toContainEqual(newPerson)
    expect(result).toEqual(newPerson)
    expect(store.creating).toBe(false)
  })

  it('searches people', async () => {
    const store = usePeopleStore()
    const mockPeople = [{ id: 1, name: 'John Doe' }]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockPeople } })

    const result = await store.searchPeople('John')
    
    expect(apiClient.get).toHaveBeenCalledWith('people?search=John')
    expect(result).toEqual(mockPeople)
  })

  it('returns empty array when search query is empty', async () => {
    const store = usePeopleStore()
    const result = await store.searchPeople('   ')
    expect(result).toEqual([])
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})
