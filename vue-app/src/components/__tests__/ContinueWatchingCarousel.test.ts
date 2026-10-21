import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ContinueWatchingCarousel from '../ContinueWatchingCarousel.vue'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import type { ContinueWatchingItem } from 'shared-types'

const mockShowToast = vi.fn()
vi.mock('@/composables/toastHandler', () => ({
  default: () => ({
    showToast: mockShowToast,
  }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ value: { data: null, isPending: false } }),
  },
}))

describe('ContinueWatchingCarousel.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockItem = {
    show: {
      id: 10,
      uuid: 'show-uuid-10',
      title: 'Severance',
      backdrop_url: 'https://example.com/backdrop.jpg',
      poster_url: 'https://example.com/poster.jpg',
      release_year: 2022,
      total_seasons: 1,
    },
    nextEpisode: {
      id: 101,
      season_number: 1,
      episode_number: 5,
      title: 'The Grim Barbarity of Optics and Design',
      still_url: 'https://example.com/still.jpg',
    },
    progressPercentage: 60,
  } as unknown as ContinueWatchingItem

  it('renders nothing when continueWatchingItems is empty', () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.continueWatchingItems = []

    const wrapper = mount(ContinueWatchingCarousel, {
      global: {
        stubs: { AppImage: true },
      },
    })

    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('fetches continue watching on mount if user is authenticated', () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    const watchlistStore = useWatchlistStore()
    const fetchSpy = vi.spyOn(watchlistStore, 'fetchContinueWatching').mockResolvedValue(undefined)

    mount(ContinueWatchingCarousel, {
      global: {
        stubs: { AppImage: true },
      },
    })

    expect(fetchSpy).toHaveBeenCalled()
  })

  it('renders items correctly and emits clickItem when card is clicked', async () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.continueWatchingItems = [mockItem]

    const wrapper = mount(ContinueWatchingCarousel, {
      global: {
        stubs: { AppImage: true },
      },
    })

    expect(wrapper.text()).toContain('Up Next')
    expect(wrapper.text()).toContain('Severance')
    expect(wrapper.text()).toContain('S1 E5 • The Grim Barbarity of Optics and Design')

    const itemCard = wrapper.find('.snap-start')
    await itemCard.trigger('click')

    expect(wrapper.emitted('clickItem')).toBeTruthy()
    expect(wrapper.emitted('clickItem')![0]).toEqual([mockItem.show])
  })

  it('marks episode as watched when mark watched button is clicked', async () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.continueWatchingItems = [mockItem]
    const markWatchedSpy = vi.spyOn(watchlistStore, 'markEpisodeWatched').mockResolvedValue(true)
    const fetchSpy = vi.spyOn(watchlistStore, 'fetchContinueWatching').mockResolvedValue(undefined)

    const wrapper = mount(ContinueWatchingCarousel, {
      global: {
        stubs: { AppImage: true },
      },
    })

    const markBtn = wrapper.find('button[title="Mark Watched"]')
    expect(markBtn.exists()).toBe(true)

    await markBtn.trigger('click')

    expect(markWatchedSpy).toHaveBeenCalledWith(10, 101)
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Marked Watched', expect.any(String))
    expect(fetchSpy).toHaveBeenCalled()
  })
})
