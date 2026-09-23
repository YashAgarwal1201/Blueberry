import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomePage from '../HomePage.vue'
import { useMoviesStore } from '@/stores/moviesStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useGenresStore } from '@/stores/genresStore'
import { useLanguagesStore } from '@/stores/languagesStore'

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

vi.mock('@/composables/toastHandeler', () => ({
  default: () => ({
    showToast: vi.fn()
  })
}))

vi.mock('@/services/apiInterceptors', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: {} }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    },
    getBackendStatus: vi.fn().mockReturnValue(true)
  }
})

describe('HomePage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Mock window.matchMedia since some child components might need it
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('renders correctly and fetches initial data', async () => {
    const preferencesStore = usePreferencesStore()
    preferencesStore.showMovies = true
    preferencesStore.showShows = true

    const moviesStore = useMoviesStore()
    moviesStore.fetchMovies = vi.fn().mockResolvedValue({})
    moviesStore.fetchHotMovies = vi.fn().mockResolvedValue({})
    moviesStore.fetchTopRatedMovies = vi.fn().mockResolvedValue({})
    
    // Set loading to true so sections render
    const genresStore = useGenresStore()
    genresStore.loading = true
    const languagesStore = useLanguagesStore()
    languagesStore.loading = true
    
    // Create wrapper with stubs to prevent deep rendering errors
    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          HeroCarousel: true,
          MediaCarousel: true,
          MediaCard: true,
          MediaDrawer: true,
          RouterLink: true,
          ChevronRight: true
        }
      }
    })

    // It should render sections
    expect(wrapper.text()).toContain('Genres')
    expect(wrapper.text()).toContain('Languages')

    // It should have called the fetch methods on mount
    expect(moviesStore.fetchMovies).toHaveBeenCalled()
  })

  it('hides movies section based on preferences', async () => {
    const preferencesStore = usePreferencesStore()
    preferencesStore.showMovies = false

    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          HeroCarousel: true,
          MediaCarousel: true,
          MediaCard: true,
          MediaDrawer: true,
          RouterLink: true,
          ChevronRight: true
        }
      }
    })

    expect(wrapper.text()).not.toContain('Trending Movies')
    expect(wrapper.text()).not.toContain('Recent Movies')
    expect(wrapper.text()).not.toContain('Top Rated Movies')
  })
})
