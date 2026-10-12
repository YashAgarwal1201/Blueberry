import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWatchlistActions } from '../useWatchlistActions'
import { useAuthStore } from '@/stores/authStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import type { MediaCard as MediaCardType } from 'shared-types'

const mockShowToast = vi.fn()
vi.mock('@/composables/toastHandler', () => ({
  default: () => ({ showToast: mockShowToast })
}))

describe('useWatchlistActions composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockShowToast.mockClear()
  })

  it('prompts to login when unauthenticated', async () => {
    const authStore = useAuthStore()
    authStore.user = null

    const { handleWatchlistAction, handleRemoveWatchlistAction } = useWatchlistActions()
    const media: MediaCardType = {
      id: 1,
      uuid: 'm-1',
      type: 'movie',
      title: 'Inception',
      status: 'released',
      in_watchlist: false
    }

    await handleWatchlistAction(media)
    expect(mockShowToast).toHaveBeenCalledWith('info', 'Login Required', 'Please login to use watchlist')

    mockShowToast.mockClear()
    await handleRemoveWatchlistAction(media)
    expect(mockShowToast).toHaveBeenCalledWith('info', 'Login Required', 'Please login to use watchlist')
  })

  it('adds movie to watchlist when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    const watchlistStore = useWatchlistStore()
    watchlistStore.addMovieToWatchlist = vi.fn().mockResolvedValue({})

    const { handleWatchlistAction } = useWatchlistActions()
    const media: MediaCardType = {
      id: 10,
      uuid: 'm-10',
      type: 'movie',
      title: 'Interstellar',
      status: 'released',
      in_watchlist: false
    }

    await handleWatchlistAction(media)
    expect(watchlistStore.addMovieToWatchlist).toHaveBeenCalledWith(10, 'want_to_watch')
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Added', 'Interstellar added to watchlist!')
  })

  it('adds tv show to watchlist when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    const watchlistStore = useWatchlistStore()
    watchlistStore.addShowToWatchlist = vi.fn().mockResolvedValue({})

    const { handleWatchlistAction } = useWatchlistActions()
    const media: MediaCardType = {
      id: 20,
      uuid: 'tv-20',
      type: 'tv',
      title: 'Breaking Bad',
      status: 'ended',
      in_watchlist: false
    }

    await handleWatchlistAction(media)
    expect(watchlistStore.addShowToWatchlist).toHaveBeenCalledWith(20, 'want_to_watch')
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Added', 'Breaking Bad added to watchlist!')
  })

  it('removes movie from watchlist when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    const watchlistStore = useWatchlistStore()
    watchlistStore.items = [{ id: 99, movie_id: 10, status: 'want_to_watch', added_at: '' }] as any
    watchlistStore.removeFromWatchlist = vi.fn().mockResolvedValue({})

    const { handleRemoveWatchlistAction } = useWatchlistActions()
    const media: MediaCardType = {
      id: 10,
      uuid: 'm-10',
      type: 'movie',
      title: 'Interstellar',
      status: 'released',
      in_watchlist: true
    }

    await handleRemoveWatchlistAction(media)
    expect(watchlistStore.removeFromWatchlist).toHaveBeenCalledWith(99)
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Removed', 'Interstellar removed from watchlist!')
  })

  it('removes tv show from watchlist when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    const watchlistStore = useWatchlistStore()
    watchlistStore.items = [{ id: 88, show_id: 20, status: 'want_to_watch', added_at: '' }] as any
    watchlistStore.removeFromWatchlist = vi.fn().mockResolvedValue({})

    const { handleRemoveWatchlistAction } = useWatchlistActions()
    const media: MediaCardType = {
      id: 20,
      uuid: 'tv-20',
      type: 'tv',
      title: 'Breaking Bad',
      status: 'ended',
      in_watchlist: true
    }

    await handleRemoveWatchlistAction(media)
    expect(watchlistStore.removeFromWatchlist).toHaveBeenCalledWith(88)
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Removed', 'Breaking Bad removed from watchlist!')
  })
})
