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

  return { movies, loading, error, fetchMoviesList }
})
