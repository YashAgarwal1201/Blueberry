import { defineStore } from 'pinia'
import { ref, watch, watchEffect } from 'vue'
import { useAuthStore } from './authStore'

import apiClient from '@/services/apiInterceptors'

export const usePreferencesStore = defineStore('preferences', () => {
  const authStore = useAuthStore()

  const defaultPreferences = {
    showMovies: true,
    showShows: true,
    showPeople: true,
    showCastDetails: true,
    blockedGenres: [] as string[],
    blockedLanguages: [] as string[],
    blockedMovies: [] as string[],
    blockedShows: [] as string[],
  }

  const showMovies = ref(defaultPreferences.showMovies)
  const showShows = ref(defaultPreferences.showShows)
  const showPeople = ref(defaultPreferences.showPeople)
  const showCastDetails = ref(defaultPreferences.showCastDetails)
  const blockedGenres = ref<string[]>([])
  const blockedLanguages = ref<string[]>([])
  const blockedMovies = ref<string[]>([])
  const blockedShows = ref<string[]>([])
  
  const isFetching = ref(false)

  const resetPreferences = () => {
    showMovies.value = defaultPreferences.showMovies
    showShows.value = defaultPreferences.showShows
    showPeople.value = defaultPreferences.showPeople
    showCastDetails.value = defaultPreferences.showCastDetails
    blockedGenres.value = []
    blockedLanguages.value = []
    blockedMovies.value = []
    blockedShows.value = []
  }

  const fetchPreferences = async () => {
    if (!authStore.isAuthenticated) return
    isFetching.value = true
    try {
      const res = await apiClient.get('/api/preferences')
      const data = res.data
      if (data.success && data.preferences) {
        showMovies.value = data.preferences.showMovies ?? defaultPreferences.showMovies
        showShows.value = data.preferences.showShows ?? defaultPreferences.showShows
        showPeople.value = data.preferences.showPeople ?? defaultPreferences.showPeople
        showCastDetails.value = data.preferences.showCastDetails ?? defaultPreferences.showCastDetails
        blockedGenres.value = data.preferences.blockedGenres || []
        blockedLanguages.value = data.preferences.blockedLanguages || []
        blockedMovies.value = data.preferences.blockedMovies || []
        blockedShows.value = data.preferences.blockedShows || []
      }
    } catch (error) {
      console.error('Failed to fetch preferences', error)
    } finally {
      isFetching.value = false
    }
  }

  const savePreferences = async () => {
    if (!authStore.isAuthenticated) return
    try {
      await apiClient.put('/api/preferences', {
        showMovies: showMovies.value,
        showShows: showShows.value,
        showPeople: showPeople.value,
        showCastDetails: showCastDetails.value,
        blockedGenres: blockedGenres.value,
        blockedLanguages: blockedLanguages.value,
        blockedMovies: blockedMovies.value,
        blockedShows: blockedShows.value,
      })
      return true
    } catch (error) {
      console.error('Failed to save preferences', error)
      return false
    }
  }

  watchEffect(() => {
    if (authStore.isAuthenticated) {
      fetchPreferences()
    } else {
      resetPreferences()
    }
  })

  const blockMovie = async (uuid: string) => {
    if (!blockedMovies.value.includes(uuid)) {
      blockedMovies.value.push(uuid)
      await savePreferences()
    }
  }

  const unblockMovie = async (uuid: string) => {
    blockedMovies.value = blockedMovies.value.filter(id => id !== uuid)
    await savePreferences()
  }

  const blockShow = async (uuid: string) => {
    if (!blockedShows.value.includes(uuid)) {
      blockedShows.value.push(uuid)
      await savePreferences()
    }
  }

  const unblockShow = async (uuid: string) => {
    blockedShows.value = blockedShows.value.filter(id => id !== uuid)
    await savePreferences()
  }

  return {
    showMovies,
    showShows,
    showPeople,
    showCastDetails,
    blockedGenres,
    blockedLanguages,
    blockedMovies,
    blockedShows,
    fetchPreferences,
    savePreferences,
    blockMovie,
    unblockMovie,
    blockShow,
    unblockShow,
    isFetching
  }
})
