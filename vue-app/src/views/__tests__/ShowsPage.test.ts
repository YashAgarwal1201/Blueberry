import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ShowsPage from '../ShowsPage.vue'
import { useTvStore } from '@/stores/tvStore'

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

describe('ShowsPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders correctly and fetches initial data', async () => {
    const tvStore = useTvStore()
    tvStore.fetchRecentShows = vi.fn().mockResolvedValue({})
    tvStore.fetchTopRatedShows = vi.fn().mockResolvedValue({})
    
    // Set loading to true so sections render
    tvStore.loading = true

    const wrapper = mount(ShowsPage, {
      global: {
        stubs: {
          HeroCarousel: true,
          MediaCarousel: true,
          MediaCard: true,
          MediaDrawer: true
        }
      }
    })

    // It should render sections
    expect(wrapper.text()).toContain('Top Rated TV Shows')
    expect(wrapper.text()).toContain('Recent TV Shows')

    // It should have called the fetch methods on mount
    expect(tvStore.fetchTopRatedShows).toHaveBeenCalled()
    expect(tvStore.fetchRecentShows).toHaveBeenCalled()
  })
})
