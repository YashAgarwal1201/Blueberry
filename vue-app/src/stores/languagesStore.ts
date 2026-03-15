// stores/languagesStore.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { Language, MovieWithLanguages } from '@/types/movies'
import { getErrorMessage } from '@/services/errorUtils'

export const useLanguagesStore = defineStore('languagesStore', () => {
  const languages = ref<Language[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Map keyed by language code — holds movies for multiple languages simultaneously
  const moviesByLanguage = ref<Map<string, MovieWithLanguages[]>>(new Map())
  const moviesLoadingMap = ref<Map<string, boolean>>(new Map())

  const languageMap = computed(() => {
    const map = new Map<number, Language>()
    languages.value.forEach((lang) => map.set(lang.id, lang))
    return map
  })

  const languageByCode = computed(() => {
    const map = new Map<string, Language>()
    languages.value.forEach((lang) => map.set(lang.code, lang))
    return map
  })

  const getLanguageName = (id: number): string => {
    return languageMap.value.get(id)?.name || 'Unknown'
  }

  const fetchLanguages = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/languages')
      languages.value = response.data.languages || []
      return languages.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching languages data')
      console.error('Error fetching languages:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addLanguage = async (name: string, code: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/languages', { name, code })
      languages.value.push(response.data.language)
      return response.data.language as Language
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error adding language')
      console.error('Error adding language:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMoviesByLanguage = async (code: string) => {
    moviesLoadingMap.value.set(code, true)
    try {
      const response = await apiClient.get(`/languages/${code}/movies?sort=recent`)
      const movies: MovieWithLanguages[] = response.data.movies || []
      moviesByLanguage.value.set(code, movies)
      return movies
    } catch (err: unknown) {
      console.error(`Error fetching movies for language ${code}:`, err)
      moviesByLanguage.value.set(code, [])
      throw err
    } finally {
      moviesLoadingMap.value.set(code, false)
    }
  }

  return {
    languages,
    loading,
    error,
    moviesByLanguage,
    moviesLoadingMap,
    languageMap,
    languageByCode,
    getLanguageName,
    fetchLanguages,
    addLanguage,
    fetchMoviesByLanguage,
  }
})
