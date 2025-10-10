import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useMainStore } from './mainStore'

export type Movie = {
  id: string
  title: string
  description?: string
}

export const useMoviesStore = defineStore('moviesStore', () => {
  const mainStore = useMainStore()
  const movies = ref<Movie[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMoviesList = async () => {
    loading.value = true
    error.value = null

    try {
      const backendUrl = mainStore.backend.url
      const response = await fetch(`${backendUrl}/items`)

      if (!response.ok) {
        throw new Error(`Failed to fetch movies: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      console.log('Api response:', data)

      // assuming backend returns something like: { items: [...] }
      movies.value = Array.isArray(data.items) ? data.items : data
    } catch (err: any) {
      console.error("Looks like there's an error while fetching the list of movies:", err)
      error.value = err.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  // 🔹 Create a new movie
  const addMovie = async (movie: Omit<Movie, 'id'>) => {
    loading.value = true
    error.value = null

    try {
      const backendUrl = mainStore.backend.url
      const response = await fetch(`${backendUrl}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movie),
      })

      if (!response.ok) {
        throw new Error(`Failed to add movie: ${response.status} ${response.statusText}`)
      }

      const newMovie = await response.json()
      // assume backend returns the created movie object
      movies.value.push(newMovie)
      return newMovie
    } catch (err: any) {
      console.error('Error adding movie:', err)
      error.value = err.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  // 🔹 Update existing movie
  const updateMovie = async (id: string, updates: Partial<Movie>) => {
    loading.value = true
    error.value = null

    try {
      const backendUrl = mainStore.backend.url
      const response = await fetch(`${backendUrl}/items/${id}`, {
        method: 'PATCH', // or PATCH if your backend supports partial updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update movie: ${response.status} ${response.statusText}`)
      }

      const updated = await response.json()
      // update local state
      const idx = movies.value.findIndex((m) => m.id === id)
      if (idx !== -1) movies.value[idx] = updated
      return updated
    } catch (err: any) {
      console.error('Error updating movie:', err)
      error.value = err.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  // 🔹 Delete a movie
  const deleteMovie = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const backendUrl = mainStore.backend.url
      const response = await fetch(`${backendUrl}/items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete movie: ${response.status} ${response.statusText}`)
      }

      // Remove from state
      movies.value = movies.value.filter((m) => m.id !== id)
    } catch (err: any) {
      console.error('Error deleting movie:', err)
      error.value = err.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return { movies, loading, error, fetchMoviesList, addMovie, updateMovie, deleteMovie }
})
