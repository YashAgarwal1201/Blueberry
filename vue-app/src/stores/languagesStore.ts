// stores/languagesStore.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { Language, MovieWithDetails, LanguageSection } from "shared-types"
import { getErrorMessage } from '@/services/errorUtils'
import { usePreferencesStore } from './preferencesStore'

export const useLanguagesStore = defineStore('languagesStore', () => {
  const languages = ref<Language[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Map keyed by language code — holds movies for multiple languages simultaneously
  const moviesByLanguage = ref<Map<string, MovieWithDetails[]>>(new Map())
  const moviesLoadingMap = ref<Map<string, boolean>>(new Map())

  const sectionsByLanguage = ref<Map<string, LanguageSection[]>>(new Map())
  const sectionsLoadingMap = ref<Map<string, boolean>>(new Map())

  const preferencesStore = usePreferencesStore()

  const visibleLanguages = computed(() => {
    return languages.value.filter(lang => !preferencesStore.blockedLanguages.includes(lang.code))
  })

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
      languages.value = response.data.data || []
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
      return response.data.data as Language
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
      const movies: MovieWithDetails[] = response.data.data.movies || []
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

  const fetchLanguageSections = async (code: string) => {
    sectionsLoadingMap.value.set(code, true)
    try {
      const response = await apiClient.get(`/languages/${code}/sections`)
      const sections: LanguageSection[] = response.data.data.sections || []
      sectionsByLanguage.value.set(code, sections)
      return sections
    } catch (err: unknown) {
      console.error(`Error fetching sections for language ${code}:`, err)
      sectionsByLanguage.value.set(code, [])
      throw err
    } finally {
      sectionsLoadingMap.value.set(code, false)
    }
  }

  return {
    languages,
    visibleLanguages,
    loading,
    error,
    moviesByLanguage,
    moviesLoadingMap,
    sectionsByLanguage,
    sectionsLoadingMap,
    languageMap,
    languageByCode,
    getLanguageName,
    fetchLanguages,
    addLanguage,
    fetchMoviesByLanguage,
    fetchLanguageSections,
  }
})
