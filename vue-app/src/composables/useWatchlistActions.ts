import { useAuthStore } from '@/stores/authStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import toastHandler from '@/composables/toastHandler'
import type { MediaCard as MediaCardType } from 'shared-types'

export function useWatchlistActions() {
  const authStore = useAuthStore()
  const watchlistStore = useWatchlistStore()
  const { showToast } = toastHandler()

  async function handleWatchlistAction(media: MediaCardType) {
    if (!authStore.isAuthenticated) {
      showToast('info', 'Login Required', 'Please login to use watchlist')
      return
    }
    try {
      if (media.type === 'movie') {
        await watchlistStore.addMovieToWatchlist(media.id, 'want_to_watch')
        showToast('success', 'Added', `${media.title} added to watchlist!`)
      } else if (media.type === 'tv') {
        await watchlistStore.addShowToWatchlist(media.id, 'want_to_watch')
        showToast('success', 'Added', `${media.title} added to watchlist!`)
      }
    } catch (error) {
      console.error('Error in watchlist action:', error)
      showToast('error', 'Error', 'Could not add to watchlist (might already exist)')
    }
  }

  async function handleRemoveWatchlistAction(media: MediaCardType) {
    if (!authStore.isAuthenticated) {
      showToast('info', 'Login Required', 'Please login to use watchlist')
      return
    }
    try {
      if (media.type === 'movie') {
        const item = watchlistStore.getItemByMovieId(media.id)
        if (item) {
          await watchlistStore.removeFromWatchlist(item.id)
          showToast('success', 'Removed', `${media.title} removed from watchlist!`)
        }
      } else if (media.type === 'tv') {
        const item = watchlistStore.getItemByShowId(media.id)
        if (item) {
          await watchlistStore.removeFromWatchlist(item.id)
          showToast('success', 'Removed', `${media.title} removed from watchlist!`)
        }
      }
    } catch (error) {
      console.error('Error in remove watchlist action:', error)
      showToast('error', 'Error', 'Could not remove from watchlist')
    }
  }

  return {
    handleWatchlistAction,
    handleRemoveWatchlistAction,
  }
}
