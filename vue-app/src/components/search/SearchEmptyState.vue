<template>
  <div class="flex flex-col gap-6">
    <!-- Recent Searches -->
    <div v-if="searchStore.recentSearches.length > 0" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="font-heading text-[10px] text-text-muted uppercase tracking-widest">
          Recent Searches
        </span>
        <button class="text-xs text-text-muted underline" @click="searchStore.clearRecent()">
          Clear all
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="term in searchStore.recentSearches"
          :key="term"
          class="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-surface-2 text-text text-sm border border-border"
        >
          <span class="cursor-pointer" @click="emitSearch(term)">{{ term }}</span>
          <button
            class="p-0.5 rounded-full text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
            @click.stop="searchStore.removeRecent(term)"
          >
            <X :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Browse by Type -->
    <div class="flex flex-col gap-3">
      <span class="font-heading text-[10px] text-text-muted uppercase tracking-widest">
        Browse by Type
      </span>
      <div class="grid grid-cols-3 gap-3">
        <button
          class="flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-surface-1 border border-border active:bg-surface-2 transition-colors"
          @click="router.push('/movies')"
        >
          <Film :size="28" class="text-primary" />
          <span class="text-sm font-medium">Movies</span>
        </button>
        <button
          class="flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-surface-1 border border-border active:bg-surface-2 transition-colors"
          @click="router.push('/shows')"
        >
          <Tv :size="28" class="text-primary" />
          <span class="text-sm font-medium">Shows</span>
        </button>
        <button
          v-if="preferencesStore.showPeople"
          class="flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-surface-1 border border-border active:bg-surface-2 transition-colors"
          @click="router.push('/people')"
        >
          <UserSquare :size="28" class="text-primary" />
          <span class="text-sm font-medium">People</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/searchStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { X, Film, Tv, UserSquare } from 'lucide-vue-next'

const router = useRouter()
const searchStore = useSearchStore()
const preferencesStore = usePreferencesStore()

const emit = defineEmits<{
  (e: 'search', term: string): void
}>()

function emitSearch(term: string) {
  emit('search', term)
}
</script>
