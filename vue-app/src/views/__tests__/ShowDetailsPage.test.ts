import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ShowDetailsPage from '../ShowDetailsPage.vue'
import { useTvStore } from '@/stores/tvStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'

const mockRoute = { params: { uuid: '456-def' }, name: 'show-details' }
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

describe('ShowDetailsPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.params.uuid = '456-def'
  })

  it('renders loading state initially', () => {
    const tvStore = useTvStore()
    tvStore.fetchShowById = vi.fn().mockReturnValue(new Promise(() => {}))
    
    const wrapper = mount(ShowDetailsPage, {
      global: {
        stubs: { ArrowLeft: true }
      }
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('renders error state on fetch failure', async () => {
    const tvStore = useTvStore()
    tvStore.fetchShowById = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    
    const wrapper = mount(ShowDetailsPage, {
      global: {
        stubs: { ArrowLeft: true, AlertCircle: true }
      }
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Failed to load show')
  })

  it('renders show details on success', async () => {
    const tvStore = useTvStore()
    const authStore = useAuthStore()
    
    authStore.isAuthenticated = true

    tvStore.fetchShowById = vi.fn().mockResolvedValue({
      id: 2,
      uuid: '456-def',
      title: 'Breaking Bad',
      description: 'Meth drama',
      status: 'ended',
      first_air_date: '2008-01-20',
      last_air_date: '2013-09-29',
      network: 'AMC',
      cast: [],
      seasons: [],
      genres: []
    })
    
    const wrapper = mount(ShowDetailsPage, {
      global: {
        stubs: { 
          ArrowLeft: true, 
          Tv: true, 
          Play: true, 
          Plus: true, 
          CheckCircle2: true, 
          ChevronDown: true, 
          Trash2: true, 
          X: true,
          MonitorPlay: true,
          User: true
        }
      }
    })

    await flushPromises()
    
    expect(wrapper.text()).toContain('Breaking Bad')
    expect(wrapper.text()).toContain('Meth drama')
    expect(wrapper.text()).toContain('2008')
    expect(wrapper.text()).toContain('AMC')
  })
})
