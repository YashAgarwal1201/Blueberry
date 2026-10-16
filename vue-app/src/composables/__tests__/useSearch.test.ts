import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSearch } from '../useSearch'
import { useSearchStore } from '@/stores/searchStore'
import { useMoviesStore } from '@/stores/moviesStore'
import { usePeopleStore } from '@/stores/peopleStore'
import apiClient from '@/services/apiInterceptors'
import type { MovieWithDetails, Person } from 'shared-types'

interface SearchItem {
  query: string
  timestamp: number
}

const mockSearches: SearchItem[] = []

vi.mock('@/services/db', () => ({
  db: {
    recentSearches: {
      orderBy: () => ({ reverse: () => ({ toArray: vi.fn().mockImplementation(async () => mockSearches) }) }),
      where: () => ({ equals: () => ({ first: vi.fn().mockResolvedValue(null) }) }),
      add: vi.fn().mockImplementation(async (item: SearchItem) => { mockSearches.push(item) }),
      count: vi.fn().mockImplementation(async () => mockSearches.length),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('useSearch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears results when query is empty', async () => {
    const { runSearch } = useSearch()
    const searchStore = useSearchStore()
    searchStore.movieResults = [{ id: 1 } as unknown as MovieWithDetails]

    await runSearch('   ')
    expect(searchStore.movieResults).toHaveLength(0)
    expect(searchStore.searching).toBe(false)
  })

  it('runs search and populates store results across movies, shows, and people', async () => {
    const moviesStore = useMoviesStore()
    const peopleStore = usePeopleStore()
    const searchStore = useSearchStore()

    moviesStore.fetchMovies = vi.fn().mockResolvedValue([{ id: 1, title: 'Inception' }] as unknown as MovieWithDetails[])
    peopleStore.searchPeople = vi.fn().mockResolvedValue([{ id: 2, name: 'Leonardo DiCaprio' }] as unknown as Person[])
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [{ id: 3, title: 'Breaking Bad' }] },
    } as never)

    const pushRecentSpy = vi.spyOn(searchStore, 'pushRecent')

    const { runSearch } = useSearch()
    await runSearch('Leonardo')

    expect(searchStore.movieResults).toEqual([{ id: 1, title: 'Inception' }])
    expect(searchStore.peopleResults).toEqual([{ id: 2, name: 'Leonardo DiCaprio' }])
    expect(searchStore.showResults).toEqual([{ id: 3, title: 'Breaking Bad' }])
    expect(pushRecentSpy).toHaveBeenCalledWith('Leonardo')
  })

  it('debounces query watch execution', async () => {
    const moviesStore = useMoviesStore()
    moviesStore.fetchMovies = vi.fn().mockResolvedValue([])

    const { query } = useSearch()
    query.value = 'Inception'

    // Before timer fires
    expect(moviesStore.fetchMovies).not.toHaveBeenCalled()

    // Advance timer past DEBOUNCE_MS (320ms)
    vi.advanceTimersByTime(350)
    await vi.runAllTimersAsync()

    expect(moviesStore.fetchMovies).toHaveBeenCalledWith({ search: 'Inception' })
  })
})
