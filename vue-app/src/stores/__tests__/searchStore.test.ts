import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSearchStore } from '../searchStore'
import type { MovieWithDetails, TVShowCard, Person } from 'shared-types'

interface SearchRecord {
  id: number
  query: string
  timestamp: number
}

let inMemoryDb: SearchRecord[] = []
let nextId = 1

vi.mock('@/services/db', () => ({
  db: {
    recentSearches: {
      orderBy: vi.fn(() => ({
        reverse: () => ({
          toArray: vi.fn().mockImplementation(async () =>
            [...inMemoryDb].sort((a, b) => b.timestamp - a.timestamp || b.id - a.id)
          ),
        }),
        limit: (n: number) => ({
          toArray: vi.fn().mockImplementation(async () =>
            [...inMemoryDb].sort((a, b) => a.timestamp - b.timestamp || a.id - b.id).slice(0, n)
          ),
        }),
      })),
      where: vi.fn((field: keyof SearchRecord) => ({
        equals: (val: unknown) => ({
          first: vi.fn().mockImplementation(async () =>
            inMemoryDb.find((item) => item[field] === val) || null
          ),
        }),
      })),
      add: vi.fn().mockImplementation(async (item: Omit<SearchRecord, 'id'>) => {
        const record: SearchRecord = { ...item, id: nextId++ }
        inMemoryDb.push(record)
        return record.id
      }),
      delete: vi.fn().mockImplementation(async (id: number) => {
        inMemoryDb = inMemoryDb.filter((item) => item.id !== id)
      }),
      clear: vi.fn().mockImplementation(async () => {
        inMemoryDb = []
      }),
      count: vi.fn().mockImplementation(async () => inMemoryDb.length),
    },
  },
}))

describe('searchStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    inMemoryDb = []
    nextId = 1
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const store = useSearchStore()
    expect(store.activeTab).toBe('all')
    expect(store.searching).toBe(false)
    expect(store.movieResults).toEqual([])
    expect(store.showResults).toEqual([])
    expect(store.peopleResults).toEqual([])
    expect(store.totalCount).toBe(0)
  })

  it('computes totalCount accurately and clearResults resets all results', () => {
    const store = useSearchStore()
    store.movieResults = [
      { id: 1 } as unknown as MovieWithDetails,
      { id: 2 } as unknown as MovieWithDetails,
    ]
    store.showResults = [{ id: 3 } as unknown as TVShowCard]
    store.peopleResults = [{ id: 4 } as unknown as Person]

    expect(store.totalCount).toBe(4)

    store.clearResults()
    expect(store.totalCount).toBe(0)
    expect(store.movieResults).toHaveLength(0)
    expect(store.showResults).toHaveLength(0)
    expect(store.peopleResults).toHaveLength(0)
  })

  it('pushRecent adds items, ignores whitespace, and removes duplicates', async () => {
    const store = useSearchStore()

    await store.pushRecent('  Inception  ')
    expect(store.recentSearches).toContain('Inception')

    // Empty/whitespace string is ignored
    await store.pushRecent('   ')
    expect(store.recentSearches.length).toBe(1)

    // Pushing the same item deletes previous record and adds new one at top
    await store.pushRecent('Interstellar')
    await store.pushRecent('Inception')
    expect(store.recentSearches).toEqual(['Inception', 'Interstellar'])
  })

  it('limits recent searches to MAX_RECENT (8 items)', async () => {
    const store = useSearchStore()

    for (let i = 1; i <= 10; i++) {
      await store.pushRecent(`Movie ${i}`)
    }

    expect(store.recentSearches.length).toBe(8)
    expect(store.recentSearches[0]).toBe('Movie 10')
  })

  it('removeRecent removes a specific search query', async () => {
    const store = useSearchStore()
    await store.pushRecent('Dune')
    await store.pushRecent('Tenet')

    expect(store.recentSearches).toEqual(['Tenet', 'Dune'])

    await store.removeRecent('Dune')
    expect(store.recentSearches).toEqual(['Tenet'])
  })

  it('clearRecent removes all searches', async () => {
    const store = useSearchStore()
    await store.pushRecent('Movie A')
    await store.pushRecent('Movie B')

    expect(store.recentSearches.length).toBe(2)

    await store.clearRecent()
    expect(store.recentSearches).toEqual([])
  })
})
