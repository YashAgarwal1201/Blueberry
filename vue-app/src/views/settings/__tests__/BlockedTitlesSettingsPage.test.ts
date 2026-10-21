import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BlockedTitlesSettingsPage from '../BlockedTitlesSettingsPage.vue'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useMoviesStore } from '@/stores/moviesStore'
import { useTvStore } from '@/stores/tvStore'
import type { MovieWithDetails, TVShowWithDetails } from 'shared-types'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ value: { isPending: false, data: null } }),
  },
}))

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        success: true,
        preferences: {
          blockedMovies: ['movie-uuid-1'],
          blockedShows: ['show-uuid-1'],
        },
      },
    }),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}))

vi.mock('@/composables/toastHandler', () => ({
  default: () => ({
    showToast: vi.fn(),
  }),
}))

describe('BlockedTitlesSettingsPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders login required state when unauthenticated', () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = false

    const wrapper = mount(BlockedTitlesSettingsPage, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    expect(wrapper.text()).toContain('Login Required')
    expect(wrapper.text()).toContain('You must be logged in to manage blocked titles.')
  })

  it('renders blocked titles and handles unblock action', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    const prefs = usePreferencesStore()
    prefs.blockedMovies = ['movie-uuid-1']
    prefs.blockedShows = ['show-uuid-1']
    prefs.unblockMovie = vi.fn().mockResolvedValue(true)

    const moviesStore = useMoviesStore()
    moviesStore.fetchMovieById = vi.fn().mockResolvedValue({
      uuid: 'movie-uuid-1',
      title: 'Blocked Movie 1',
      release_year: 2021,
    } as unknown as MovieWithDetails)

    const tvStore = useTvStore()
    tvStore.fetchShowById = vi.fn().mockResolvedValue({
      uuid: 'show-uuid-1',
      title: 'Blocked Show 1',
      release_year: 2022,
    } as unknown as TVShowWithDetails)

    const wrapper = mount(BlockedTitlesSettingsPage, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 20))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Blocked Titles')
    expect(wrapper.text()).toContain('Blocked Movie 1')
    expect(wrapper.text()).toContain('Blocked Show 1')

    const unblockBtn = wrapper.find('button[title="Unblock"]')
    expect(unblockBtn.exists()).toBe(true)
    await unblockBtn.trigger('click')

    expect(prefs.unblockMovie).toHaveBeenCalledWith('movie-uuid-1')
  })
})
