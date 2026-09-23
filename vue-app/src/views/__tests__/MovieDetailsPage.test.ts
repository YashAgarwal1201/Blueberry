import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MovieDetailsPage from '../MovieDetailsPage.vue'
import { useMoviesStore } from '@/stores/moviesStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

const mockRoute = { params: { uuid: '123-abc' }, name: 'movie-details' }
const mockRouter = { push: vi.fn(), back: vi.fn() }

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
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
      get: vi.fn((url) => {
        if (url && url.includes('watchlist')) return Promise.resolve({ data: { data: { items: [] } } })
        if (url && url.includes('preferences')) return Promise.resolve({ data: { data: {} } })
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

describe('MovieDetailsPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.params.uuid = '123-abc'
  })

  it('renders loading state initially', () => {
    const moviesStore = useMoviesStore()
    moviesStore.fetchMovieById = vi.fn().mockReturnValue(new Promise(() => {}))
    
    const wrapper = mount(MovieDetailsPage, {
      global: {
        stubs: { ArrowLeft: true }
      }
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('renders error state on fetch failure', async () => {
    const moviesStore = useMoviesStore()
    moviesStore.fetchMovieById = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    
    const wrapper = mount(MovieDetailsPage, {
      global: {
        stubs: { ArrowLeft: true, AlertCircle: true }
      }
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick() // Need another tick for promise rejection
    await wrapper.vm.$nextTick() // Another tick to let error render
    
    expect(wrapper.text()).toContain('Failed to load movie')
  })

  it('renders movie details on success', async () => {
    const moviesStore = useMoviesStore()
    const authStore = useAuthStore()
    
    authStore.isAuthenticated = true

    moviesStore.fetchMovieById = vi.fn().mockResolvedValue({
      id: 1,
      uuid: '123-abc',
      title: 'Inception',
      description: 'A dream within a dream',
      release_year: 2010,
      runtime: 148,
      status: 'released',
      cast: [],
      genres: [],
      companies: []
    })
    
    const wrapper = mount(MovieDetailsPage, {
      global: {
        stubs: { 
          ArrowLeft: true, 
          Clock: true, 
          Play: true, 
          Plus: true, 
          CheckCircle2: true, 
          ChevronDown: true, 
          Trash2: true, 
          Edit: true, 
          X: true 
        }
      }
    })

    await flushPromises()
    
    expect(wrapper.text()).toContain('Inception')
    expect(wrapper.text()).toContain('A dream within a dream')
    expect(wrapper.text()).toContain('148 min')
    expect(wrapper.text()).toContain('released')
  })
})
