import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { Genre, MovieWithDetails, GenreSection } from "shared-types"
import { getErrorMessage } from '@/services/errorUtils'
import { usePreferencesStore } from './preferencesStore'

export const useGenresStore = defineStore('genresStore', () => {
  const genres = ref<Genre[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Map keyed by slug — holds movies for multiple genres simultaneously
  const moviesByGenre = ref<Map<string, MovieWithDetails[]>>(new Map())
  const moviesLoadingMap = ref<Map<string, boolean>>(new Map())
  
  const sectionsByGenre = ref<Map<string, GenreSection[]>>(new Map())
  const sectionsLoadingMap = ref<Map<string, boolean>>(new Map())

  const preferencesStore = usePreferencesStore()

  const visibleGenres = computed(() => {
    return genres.value.filter(g => !preferencesStore.blockedGenres.includes(g.slug))
  })

  const genreMap = computed(() => {
    const map = new Map<number, Genre>()
    genres.value.forEach((g) => map.set(g.id, g))
    return map
  })

  const genreBySlug = computed(() => {
    const map = new Map<string, Genre>()
    genres.value.forEach((g) => map.set(g.slug, g))
    return map
  })

  const fetchGenres = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/genres')
      genres.value = response.data.data || []
      return genres.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching genres')
      console.error('Error fetching genres:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addGenre = async (name: string, description?: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/genres', { name, description })
      genres.value.push(response.data.genre)
      return response.data.data as Genre
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error adding genre')
      console.error('Error adding genre:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMoviesByGenre = async (slug: string) => {
    moviesLoadingMap.value.set(slug, true)
    try {
      const response = await apiClient.get(`/genres/${slug}/movies?sort=recent`)
      const movies: MovieWithDetails[] = response.data.data.movies || []
      moviesByGenre.value.set(slug, movies)
      return movies
    } catch (err: unknown) {
      // const message = getErrorMessage(err, 'Error creating person')
      console.error(`Error fetching movies for genre ${slug}:`, err)
      moviesByGenre.value.set(slug, [])
      throw err
    } finally {
      moviesLoadingMap.value.set(slug, false)
    }
  }

  const fetchGenreSections = async (slug: string) => {
    sectionsLoadingMap.value.set(slug, true)
    try {
      const response = await apiClient.get(`/genres/${slug}/sections`)
      const sections: GenreSection[] = response.data.data.sections || []
      sectionsByGenre.value.set(slug, sections)
      return sections
    } catch (err: unknown) {
      console.error(`Error fetching sections for genre ${slug}:`, err)
      sectionsByGenre.value.set(slug, [])
      throw err
    } finally {
      sectionsLoadingMap.value.set(slug, false)
    }
  }

  return {
    genres,
    visibleGenres,
    loading,
    error,
    moviesByGenre,
    moviesLoadingMap,
    sectionsByGenre,
    sectionsLoadingMap,
    genreMap,
    genreBySlug,
    fetchGenres,
    addGenre,
    fetchMoviesByGenre,
    fetchGenreSections,
  }
})
