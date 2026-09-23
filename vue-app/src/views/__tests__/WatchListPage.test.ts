import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WatchListPage from '../WatchListPage.vue'
import { useWatchlistStore } from '@/stores/watchListStore'

vi.mock('@/services/apiInterceptors', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: { data: { items: [] } } }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    },
    getBackendStatus: vi.fn().mockReturnValue(true)
  }
})

describe('WatchListPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders loading state initially', () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.loading = true

    const wrapper = mount(WatchListPage, {
      global: {
        stubs: {
          Panel: {
            template: '<div><slot name="header"></slot><slot></slot></div>'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('Loading watchlist...')
  })

  it('renders categories when data is available', async () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.fetchWatchlist = vi.fn().mockResolvedValue([])
    
    // Set some mock data directly
    watchlistStore.items = [
      { id: 1, status: 'want_to_watch', movie: { id: 101, title: 'Plan Movie', release_year: 2021 } } as any,
      { id: 2, status: 'watching', movie: { id: 102, title: 'Watching Movie', release_year: 2022 } } as any,
      { id: 3, status: 'watched', watched_at: '2023-01-01', movie: { id: 103, title: 'Watched Movie', release_year: 2023 } } as any
    ]
    watchlistStore.loading = false

    const wrapper = mount(WatchListPage, {
      global: {
        stubs: {
          Panel: {
            template: '<div><slot name="header"></slot><slot></slot></div>'
          }
        }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Plan Movie')
    expect(wrapper.text()).toContain('Watching Movie')
    expect(wrapper.text()).toContain('Watched Movie')
    expect(wrapper.text()).toContain('2021')
    expect(wrapper.text()).toContain('2022')
  })

  it('calls updateStatus when button is clicked', async () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.fetchWatchlist = vi.fn().mockResolvedValue([])
    watchlistStore.updateStatus = vi.fn().mockResolvedValue({})
    
    watchlistStore.items = [
      { id: 1, status: 'want_to_watch', movie: { id: 101, title: 'Plan Movie', release_year: 2021 } } as any
    ]
    watchlistStore.loading = false

    const wrapper = mount(WatchListPage, {
      global: {
        stubs: {
          Panel: {
            template: '<div><slot name="header"></slot><slot></slot></div>'
          }
        }
      }
    })

    await wrapper.vm.$nextTick()
    
    // Find "Start Watching" button
    const buttons = wrapper.findAll('button')
    const startWatchingBtn = buttons.find(b => b.text() === 'Start Watching')
    expect(startWatchingBtn).toBeDefined()
    
    await startWatchingBtn?.trigger('click')
    
    expect(watchlistStore.updateStatus).toHaveBeenCalledWith(1, 'watching')
  })

  it('calls removeItem when button is clicked', async () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.fetchWatchlist = vi.fn().mockResolvedValue([])
    watchlistStore.removeFromWatchlist = vi.fn().mockResolvedValue({})
    
    watchlistStore.items = [
      { id: 1, status: 'want_to_watch', movie: { id: 101, title: 'Plan Movie', release_year: 2021 } } as any
    ]
    watchlistStore.loading = false

    const wrapper = mount(WatchListPage, {
      global: {
        stubs: {
          Panel: {
            template: '<div><slot name="header"></slot><slot></slot></div>'
          }
        }
      }
    })

    await wrapper.vm.$nextTick()
    
    // Find "Remove" button
    const buttons = wrapper.findAll('button')
    const removeBtn = buttons.find(b => b.text() === 'Remove')
    expect(removeBtn).toBeDefined()
    
    await removeBtn?.trigger('click')
    
    expect(watchlistStore.removeFromWatchlist).toHaveBeenCalledWith(1)
  })
})
