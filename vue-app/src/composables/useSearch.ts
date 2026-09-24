import { ref, watch } from 'vue'
import { useSearchStore } from '@/stores/searchStore'
import { useMoviesStore } from '@/stores/moviesStore'
import { usePeopleStore } from '@/stores/peopleStore'
import apiClient from '@/services/apiInterceptors'
import type { TVShowCard } from 'shared-types'

const DEBOUNCE_MS = 320

export function useSearch() {
  const searchStore = useSearchStore()
  const moviesStore = useMoviesStore()
  const peopleStore = usePeopleStore()

  const query = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function runSearch(q: string) {
    const trimmed = q.trim()
    if (!trimmed) {
      searchStore.clearResults()
      searchStore.searching = false
      return
    }

    searchStore.searching = true
    try {
      // Run all three fetches in parallel
      const [movies, people, showsRes] = await Promise.allSettled([
        moviesStore.fetchMovies({ search: trimmed }),
        peopleStore.searchPeople(trimmed),
        apiClient.get(`tv?search=${encodeURIComponent(trimmed)}`),
      ])

      searchStore.movieResults = movies.status === 'fulfilled' ? (movies.value ?? []) : []
      searchStore.peopleResults = people.status === 'fulfilled' ? people.value : []
      searchStore.showResults =
        showsRes.status === 'fulfilled' ? (showsRes.value.data.data as TVShowCard[]) ?? [] : []

      searchStore.pushRecent(trimmed)
    } finally {
      searchStore.searching = false
    }
  }

  watch(query, (newVal) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!newVal.trim()) {
      searchStore.clearResults()
      return
    }
    debounceTimer = setTimeout(() => runSearch(newVal), DEBOUNCE_MS)
  })

  return { query, runSearch }
}
