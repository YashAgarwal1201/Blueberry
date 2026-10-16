import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MediaDrawer from '../MediaDrawer.vue'
import { useWatchlistStore } from '@/stores/watchListStore'
import type { MediaCard } from 'shared-types'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ value: { data: null, isPending: false } }),
  },
}))

describe('MediaDrawer.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockMovie: MediaCard = {
    id: 101,
    uuid: 'uuid-101',
    title: 'Inception',
    type: 'movie',
    status: 'released',
    in_watchlist: false,
    backdrop_url: 'https://image.tmdb.org/backdrop.jpg',
    poster_url: 'https://image.tmdb.org/poster.jpg',
    release_year: 2010,
    age_rating: 'PG-13',
    runtime: 148,
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
    genres: [{ id: 1, name: 'Sci-Fi', slug: 'sci-fi' }, { id: 2, name: 'Action', slug: 'action' }],
  }

  const mockShow: MediaCard = {
    id: 202,
    uuid: 'uuid-202',
    title: 'Stranger Things',
    type: 'tv',
    status: 'ended',
    in_watchlist: false,
    backdrop_url: undefined,
    poster_url: undefined,
    release_year: 2016,
    genres: [{ id: 3, name: 'Drama', slug: 'drama' }],
  }

  it('renders media details correctly when visible and media is provided', () => {
    const wrapper = mount(MediaDrawer, {
      props: {
        visible: true,
        media: mockMovie,
      },
      global: {
        stubs: {
          Drawer: {
            props: ['visible'],
            template: '<div v-if="visible" class="p-drawer"><slot /></div>',
          },
          AppImage: true,
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          SaveToCollectionModal: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Inception')
    expect(wrapper.text()).toContain('2010')
    expect(wrapper.text()).toContain('PG-13')
    expect(wrapper.text()).toContain('148 min')
    expect(wrapper.text()).toContain('movie')
    expect(wrapper.text()).toContain('Sci-Fi')
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('A thief who steals corporate secrets')
  })

  it('emits watchlistAction when item is not in watchlist and watchlist button is clicked', async () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.isMovieInWatchlist = vi.fn().mockReturnValue(false)

    const wrapper = mount(MediaDrawer, {
      props: {
        visible: true,
        media: mockMovie,
      },
      global: {
        stubs: {
          Drawer: {
            props: ['visible'],
            template: '<div v-if="visible"><slot /></div>',
          },
          AppImage: true,
          RouterLink: true,
          SaveToCollectionModal: true,
        },
      },
    })

    const buttons = wrapper.findAll('button')
    const watchlistBtn = buttons.find((b) => b.text().includes('Watchlist'))
    expect(watchlistBtn?.exists()).toBe(true)

    await watchlistBtn!.trigger('click')
    expect(wrapper.emitted('watchlistAction')).toBeTruthy()
    expect(wrapper.emitted('watchlistAction')![0]).toEqual([mockMovie])
  })

  it('emits removeWatchlistAction when item is already in watchlist', async () => {
    const watchlistStore = useWatchlistStore()
    watchlistStore.isMovieInWatchlist = vi.fn().mockReturnValue(true)

    const wrapper = mount(MediaDrawer, {
      props: {
        visible: true,
        media: mockMovie,
      },
      global: {
        stubs: {
          Drawer: {
            props: ['visible'],
            template: '<div v-if="visible"><slot /></div>',
          },
          AppImage: true,
          RouterLink: true,
          SaveToCollectionModal: true,
        },
      },
    })

    const buttons = wrapper.findAll('button')
    const inWatchlistBtn = buttons.find((b) => b.text().includes('In Watchlist'))
    expect(inWatchlistBtn?.exists()).toBe(true)

    await inWatchlistBtn!.trigger('click')
    expect(wrapper.emitted('removeWatchlistAction')).toBeTruthy()
    expect(wrapper.emitted('removeWatchlistAction')![0]).toEqual([mockMovie])
  })

  it('checks isShowInWatchlist for tv type and emits update:visible when close button is clicked', async () => {
    const watchlistStore = useWatchlistStore()
    const isShowSpy = vi.fn().mockReturnValue(false)
    watchlistStore.isShowInWatchlist = isShowSpy

    const wrapper = mount(MediaDrawer, {
      props: {
        visible: true,
        media: mockShow,
      },
      global: {
        stubs: {
          Drawer: {
            props: ['visible'],
            template: '<div v-if="visible"><slot /></div>',
          },
          AppImage: true,
          RouterLink: true,
          SaveToCollectionModal: true,
        },
      },
    })

    expect(isShowSpy).toHaveBeenCalledWith(202)

    // Close button (first button with X)
    const closeBtn = wrapper.find('button')
    await closeBtn.trigger('click')
    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')![0]).toEqual([false])
  })
})
