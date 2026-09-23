import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AllMoviesPage from '../AllMoviesPage.vue'
import { useMoviesStore } from '@/stores/moviesStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useWatchlistStore } from '@/stores/watchListStore'

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

vi.mock('@/services/apiInterceptors', () => {
  return {
    default: {
      get: vi.fn((url) => {
        if (url && url.includes('watchlist')) return Promise.resolve({ data: { data: { items: [] } } })
        return Promise.resolve({ data: { data: [] } })
      }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    },
    getBackendStatus: vi.fn().mockReturnValue(true)
  }
})

describe('AllMoviesPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    const moviesStore = useMoviesStore()
    moviesStore.loading = true
    moviesStore.movies = []

    const wrapper = mount(AllMoviesPage, {
      global: {
        stubs: { Search: true, X: true, Heart: true, Plus: true }
      }
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('renders movies and filters when data is available', async () => {
    const moviesStore = useMoviesStore()
    const languagesStore = useLanguagesStore()
    const watchlistStore = useWatchlistStore()
    
    moviesStore.fetchMovies = vi.fn().mockResolvedValue({})
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    watchlistStore.fetchWatchlist = vi.fn().mockResolvedValue({})

    moviesStore.movies = [
      { id: 1, title: 'Inception', release_year: 2010, languages: [{ id: 1, code: 'en' }], genres: [] },
      { id: 2, title: 'Interstellar', release_year: 2014, languages: [{ id: 1, code: 'en' }], genres: [] }
    ] as any
    languagesStore.languages = [{ id: 1, code: 'en', name: 'English' }] as any
    watchlistStore.items = []
    
    moviesStore.loading = false

    const wrapper = mount(AllMoviesPage, {
      global: {
        stubs: { Search: true, X: true, Heart: true, Plus: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Inception')
    expect(wrapper.text()).toContain('Interstellar')
    expect(wrapper.text()).toContain('2 movies')
  })

  it('applies filters and calls fetchMovies', async () => {
    const moviesStore = useMoviesStore()
    moviesStore.fetchMovies = vi.fn().mockResolvedValue({})
    moviesStore.loading = false
    moviesStore.movies = []

    const wrapper = mount(AllMoviesPage, {
      global: {
        stubs: { Search: true, X: true, Heart: true, Plus: true }
      }
    })

    const selectSort = wrapper.findAll('select')[2] // third select is Sort by
    await selectSort.setValue('title')
    
    expect(moviesStore.fetchMovies).toHaveBeenCalledWith({ sort: 'title' })
  })

  it('filters displayed movies by search query locally', async () => {
    const moviesStore = useMoviesStore()
    moviesStore.fetchMovies = vi.fn().mockResolvedValue({})
    
    moviesStore.movies = [
      { id: 1, title: 'Inception', release_year: 2010, languages: [], genres: [] },
      { id: 2, title: 'Interstellar', release_year: 2014, languages: [], genres: [] }
    ] as any
    moviesStore.loading = false

    const wrapper = mount(AllMoviesPage, {
      global: {
        stubs: { Search: true, X: true, Heart: true, Plus: true }
      }
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('incept')
    
    expect(wrapper.text()).toContain('Inception')
    expect(wrapper.text()).not.toContain('Interstellar')
    expect(wrapper.text()).toContain('1 movie')
  })
})
