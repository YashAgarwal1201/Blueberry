import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { MovieWithDetails, CreateMovieRequest, UpdateMovieRequest } from "shared-types"
import { getErrorMessage } from '@/services/errorUtils'

export const useMoviesStore = defineStore('moviesStore', () => {
  const movies = ref<MovieWithDetails[]>([])
  const topRatedMovies = ref<MovieWithDetails[]>([])
  const hotMovies = ref<MovieWithDetails[]>([])
  
  const loading = ref(false)
  const loadingMovies = loading
  const loadingTopRated = ref(false)
  const loadingHot = ref(false)
  const loadingMovieById = ref(false)
  const loadingMutate = ref(false)
  const error = ref<string | null>(null)

  const movieCount = computed(() => movies.value.length)

  const moviesByYear = computed(() => {
    const grouped = new Map<number, MovieWithDetails[]>()
    movies.value.forEach((movie) => {
      const year = movie.release_year ?? 0
      if (!grouped.has(year)) grouped.set(year, [])
      grouped.get(year)!.push(movie)
    })
    return grouped
  })

  const recentMovies = computed(() => [...movies.value].slice(0, 10))

  const findMovieById = (uuid: string): MovieWithDetails | undefined => {
    return movies.value.find((m) => m.uuid === uuid)
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
      const url = `movies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await apiClient.get(url)
      movies.value = response.data.data as MovieWithDetails[]
      return response.data.data as MovieWithDetails[]
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching movies')
      console.error('Error fetching movies:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTopRatedMovies = async () => {
    loadingTopRated.value = true
    try {
      const response = await apiClient.get('movies/top-rated')
      topRatedMovies.value = response.data.data as MovieWithDetails[]
      return topRatedMovies.value
    } catch (err: unknown) {
      console.error('Error fetching top rated movies:', err)
      throw err
    } finally {
      loadingTopRated.value = false
    }
  }

  const fetchHotMovies = async () => {
    loadingHot.value = true
    try {
      const response = await apiClient.get('movies/hot')
      hotMovies.value = response.data.data as MovieWithDetails[]
      return hotMovies.value
    } catch (err: unknown) {
      console.error('Error fetching hot movies:', err)
      throw err
    } finally {
      loadingHot.value = false
    }
  }

  const fetchMovieById = async (uuid: string) => {
    loadingMovieById.value = true
    error.value = null
    try {
      const response = await apiClient.get(`movies/${uuid}`)
      return response.data.data as MovieWithDetails
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching movie')
      console.error('Error fetching movie:', err)
      error.value = message
      throw err
    } finally {
      loadingMovieById.value = false
    }
  }

  const fetchSimilarMovies = async (uuid: string) => {
    try {
      const response = await apiClient.get(`movies/${uuid}/similar`)
      return response.data.data as MovieWithDetails[]
    } catch (err: unknown) {
      console.error('Error fetching similar movies:', err)
      throw err
    }
  }

  const addMovie = async (movieData: CreateMovieRequest) => {
    loadingMutate.value = true
    error.value = null
    try {
      const response = await apiClient.post('movies', movieData)
      const newMovie = response.data.data as MovieWithDetails
      movies.value.unshift(newMovie)
      return newMovie
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error adding movie')
      console.error('Error adding movie:', err)
      error.value = message
      throw err
    } finally {
      loadingMutate.value = false
    }
  }

  const updateMovie = async (uuid: string, updates: UpdateMovieRequest) => {
    loadingMutate.value = true
    error.value = null
    try {
      const response = await apiClient.put(`movies/${uuid}`, updates)
      const updatedMovie = response.data.data as MovieWithDetails
      const idx = movies.value.findIndex((m) => m.uuid === uuid)
      if (idx !== -1) movies.value[idx] = updatedMovie
      return updatedMovie
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error updating movie')
      console.error('Error updating movie:', err)
      error.value = message
      throw err
    } finally {
      loadingMutate.value = false
    }
  }

  const deleteMovie = async (uuid: string) => {
    loadingMutate.value = true
    error.value = null
    try {
      await apiClient.delete(`movies/${uuid}`)
      movies.value = movies.value.filter((m) => m.uuid !== uuid)
      return true
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error deleting movie')
      console.error('Error deleting movie:', err)
      error.value = message
      throw err
    } finally {
      loadingMutate.value = false
    }
  }

  const removeMovieLocally = (uuid: string) => {
    movies.value = movies.value.filter(m => m.uuid !== uuid)
    topRatedMovies.value = topRatedMovies.value.filter(m => m.uuid !== uuid)
    hotMovies.value = hotMovies.value.filter(m => m.uuid !== uuid)
  }

  const searchLocal = (query: string) => {
    if (!query) return movies.value
    const lowerQuery = query.toLowerCase()
    return movies.value.filter(
      (m) =>
        m.title.toLowerCase().includes(lowerQuery) ||
        m.description?.toLowerCase().includes(lowerQuery) ||
        m.tagline?.toLowerCase().includes(lowerQuery) ||
        m.genres.some((g) => g.name.toLowerCase().includes(lowerQuery)) ||
        m.cast.some((c) => c.name.toLowerCase().includes(lowerQuery)),
    )
  }

  return {
    movies,
    topRatedMovies,
    hotMovies,
    loading,
    loadingMovies,
    loadingTopRated,
    loadingHot,
    loadingMovieById,
    loadingMutate,
    error,
    movieCount,
    moviesByYear,
    recentMovies,
    fetchMovies,
    fetchTopRatedMovies,
    fetchHotMovies,
    fetchMovieById,
    fetchSimilarMovies,
    addMovie,
    updateMovie,
    deleteMovie,
    removeMovieLocally,
    findMovieById,
    searchLocal,
  }
})
