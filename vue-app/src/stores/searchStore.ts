// src/stores/searchStore.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useMoviesStore } from './moviesStore'
import { useTvStore } from './tvStore'
import { usePeopleStore } from './peopleStore'
import type { MovieWithDetails, TVShowCard, Person } from 'shared-types'
import { db } from '@/services/db'

export type SearchTab = 'all' | 'movies' | 'shows' | 'people'

const MAX_RECENT = 8

export const useSearchStore = defineStore('searchStore', () => {
  const moviesStore = useMoviesStore()
  const tvStore = useTvStore()
  const peopleStore = usePeopleStore()

  // ── Tab ─────────────────────────────────────────────────────────────────────
  const activeTab = ref<SearchTab>('all')

  // ── Recent Searches ─────────────────────────────────────────────────────────
  const recentSearches = ref<string[]>([])

  async function loadRecent() {
    const items = await db.recentSearches.orderBy('timestamp').reverse().toArray()
    recentSearches.value = items.map(i => i.query)
  }

  async function pushRecent(query: string) {
    const q = query.trim()
    if (!q) return
    
    const existing = await db.recentSearches.where('query').equals(q).first()
    if (existing && existing.id) {
      await db.recentSearches.delete(existing.id)
    }
    
    await db.recentSearches.add({
      query: q,
      timestamp: Date.now()
    })

    const count = await db.recentSearches.count()
    if (count > MAX_RECENT) {
      const oldest = await db.recentSearches.orderBy('timestamp').limit(count - MAX_RECENT).toArray()
      for (const item of oldest) {
        if (item.id) await db.recentSearches.delete(item.id)
      }
    }
    
    await loadRecent()
  }

  async function removeRecent(query: string) {
    const existing = await db.recentSearches.where('query').equals(query).first()
    if (existing && existing.id) {
      await db.recentSearches.delete(existing.id)
    }
    await loadRecent()
  }

  async function clearRecent() {
    await db.recentSearches.clear()
    await loadRecent()
  }

  // Load on setup
  loadRecent()

  // ── Loading ──────────────────────────────────────────────────────────────────
  const searching = ref(false)

  // ── Results — derived from existing stores ───────────────────────────────────
  const movieResults = ref<MovieWithDetails[]>([])
  const showResults = ref<TVShowCard[]>([])
  const peopleResults = ref<Person[]>([])

  const totalCount = computed(
    () => movieResults.value.length + showResults.value.length + peopleResults.value.length
  )

  function clearResults() {
    movieResults.value = []
    showResults.value = []
    peopleResults.value = []
  }

  return {
    activeTab,
    recentSearches,
    searching,
    movieResults,
    showResults,
    peopleResults,
    totalCount,
    pushRecent,
    removeRecent,
    clearRecent,
    clearResults,
  }
})
