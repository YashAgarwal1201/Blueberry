import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoviesPage from '../MoviesPage.vue'
import { useMoviesStore } from '@/stores/moviesStore'

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

describe('MoviesPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders correctly and fetches initial data', async () => {
    const moviesStore = useMoviesStore()
    moviesStore.fetchMovies = vi.fn().mockResolvedValue({})
    moviesStore.fetchHotMovies = vi.fn().mockResolvedValue({})
    moviesStore.fetchTopRatedMovies = vi.fn().mockResolvedValue({})
    
    // Set loading to true so sections render
    moviesStore.loading = true
    moviesStore.loadingHot = true
    moviesStore.loadingTopRated = true

    const wrapper = mount(MoviesPage, {
      global: {
        stubs: {
          HeroCarousel: true,
          MediaCarousel: true,
          MediaCard: true,
          MediaDrawer: true,
          RouterLink: true
        }
      }
    })

    // It should render sections
    expect(wrapper.text()).toContain('Trending Movies')
    expect(wrapper.text()).toContain('Recent Movies')
    expect(wrapper.text()).toContain('Top Rated Movies')

    // It should have called the fetch methods on mount
    expect(moviesStore.fetchMovies).toHaveBeenCalled()
    expect(moviesStore.fetchHotMovies).toHaveBeenCalled()
    expect(moviesStore.fetchTopRatedMovies).toHaveBeenCalled()
  })
})
