// stores/moviesStore.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
// import { useMainStore } from './mainStore'
import apiClient from '@/services/apiInterceptors'
import type { MovieWithLanguages, CreateMovieRequest, UpdateMovieRequest } from '@/types/movies'

export const useMoviesStore = defineStore('moviesStore', () => {
  // const mainStore = useMainStore()

  const movies = ref<MovieWithLanguages[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const movieCount = computed(() => movies.value.length)

  const moviesByYear = computed(() => {
    const grouped = new Map<number, MovieWithLanguages[]>()
    movies.value.forEach((movie) => {
      const year = movie.release_year || 0
      if (!grouped.has(year)) {
        grouped.set(year, [])
      }
      grouped.get(year)!.push(movie)
    })
    return grouped
  })

  const recentMovies = computed(() => {
    return [...movies.value].slice(0, 10)
  })

  const findMovieById = (id: number): MovieWithLanguages | undefined => {
    return movies.value.find((m) => m.id === id)
  }

  const fetchMovies = async (params?: {
    search?: string
    language?: string
    year?: number
    sort?: 'title' | 'year' | 'recent'
  }) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append('search', params.search)
      if (params?.language) queryParams.append('language', params.language)
      if (params?.year) queryParams.append('year', params.year.toString())
      if (params?.sort) queryParams.append('sort', params.sort)

      const url = `/movies${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await apiClient.get(url)
      const data = response.data

      movies.value = data.movies || []
      return data.movies
    } catch (err: any) {
      console.error('Error fetching movies:', err)
      error.value = err.message || 'Error fetching movies'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMovieById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/movies/${id}`)
      const data = response.data
      return data.movie as MovieWithLanguages
    } catch (err: any) {
      console.error('Error fetching movie:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addMovie = async (movieData: CreateMovieRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/movies', movieData)
      const data = response.data
      const newMovie = data.movie as MovieWithLanguages
      movies.value.unshift(newMovie)
      return newMovie
    } catch (err: any) {
      console.error('Error adding movie:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateMovie = async (id: number, updates: UpdateMovieRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put(`/movies/${id}`, updates)
      const data = response.data
      const updatedMovie = data.movie as MovieWithLanguages
      const idx = movies.value.findIndex((m) => m.id === id)
      if (idx !== -1) {
        movies.value[idx] = updatedMovie
      }
      return updatedMovie
    } catch (err: any) {
      console.error('Error updating movie:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteMovie = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/movies/${id}`)
      movies.value = movies.value.filter((m) => m.id !== id)
      return true
    } catch (err: any) {
      console.error('Error deleting movie:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchLocal = (query: string) => {
    if (!query) return movies.value
    const lowerQuery = query.toLowerCase()
    return movies.value.filter(
      (m) =>
        m.title.toLowerCase().includes(lowerQuery) ||
        m.description?.toLowerCase().includes(lowerQuery) ||
        m.director?.toLowerCase().includes(lowerQuery),
    )
  }

  return {
    movies,
    loading,
    error,
    movieCount,
    moviesByYear,
    recentMovies,
    fetchMovies,
    fetchMovieById,
    addMovie,
    updateMovie,
    deleteMovie,
    findMovieById,
    searchLocal,
  }
})
