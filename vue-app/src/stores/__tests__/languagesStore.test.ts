import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLanguagesStore } from '../languagesStore'
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

describe('languagesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(usePreferencesStore).mockReturnValue({ blockedLanguages: ['es'] } as any)
  })

  it('initializes correctly', () => {
    const store = useLanguagesStore()
    expect(store.languages).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetches languages and filters visible languages', async () => {
    const store = useLanguagesStore()
    const mockLanguages = [
      { id: 1, name: 'English', code: 'en' },
      { id: 2, name: 'Spanish', code: 'es' }
    ]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockLanguages } })

    const result = await store.fetchLanguages()
    
    expect(apiClient.get).toHaveBeenCalledWith('/languages')
    expect(store.languages).toEqual(mockLanguages)
    expect(result).toEqual(mockLanguages)
    
    // Check computed properties
    expect(store.visibleLanguages).toHaveLength(1)
    expect(store.visibleLanguages[0].code).toBe('en')
    expect(store.languageMap.get(1)?.name).toBe('English')
    expect(store.languageByCode.get('es')?.name).toBe('Spanish')
    expect(store.getLanguageName(1)).toBe('English')
    expect(store.getLanguageName(99)).toBe('Unknown')
  })

  it('fetches movies by language', async () => {
    const store = useLanguagesStore()
    const mockMovies = [{ title: 'English Movie' }]
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: { movies: mockMovies } } })

    const result = await store.fetchMoviesByLanguage('en')
    
    expect(apiClient.get).toHaveBeenCalledWith('/languages/en/movies?sort=recent')
    expect(store.moviesByLanguage.get('en')).toEqual(mockMovies)
    expect(result).toEqual(mockMovies)
    expect(store.moviesLoadingMap.get('en')).toBe(false)
  })
})
