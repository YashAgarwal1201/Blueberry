<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-border rounded-xl overflow-y-auto"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text">Languages</h1>
        <p class="font-content text-text-muted">Browse your collection by language</p>
      </div>
      <button
        @click="showAddDialog = true"
        class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm"
      >
        + Add Language
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="languagesStore.loading || !allLoaded" class="flex flex-col gap-10">
      <div v-for="n in 4" :key="n" class="flex flex-col gap-3">
        <div class="h-5 w-28 rounded-lg bg-surface-3 animate-pulse"></div>
        <div class="flex gap-3">
          <div
            v-for="m in 5"
            :key="m"
            class="flex-shrink-0 w-36 h-52 rounded-xl bg-surface-3 animate-pulse"
          ></div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-10">
      <div
        v-if="populatedLanguages.length === 0"
        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <span class="text-4xl">🎬</span>
        <p class="text-text font-medium">No movies added yet.</p>
        <p class="text-text-muted text-sm">Add movies and assign languages to see them here.</p>
      </div>

      <div v-for="lang in populatedLanguages" :key="lang.id" class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="font-heading text-lg text-text">{{ lang.name }}</h2>
            <span v-if="lang.native_script" class="text-sm text-text-muted"
              >· {{ lang.native_script }}</span
            >
          </div>
          <RouterLink :to="`/languages/${lang.code}`" class="text-sm text-primary hover:underline">
            View All →
          </RouterLink>
        </div>
        <div class="flex flex-nowrap gap-3 overflow-x-auto pb-1">
          <RouterLink
            v-for="movie in (languagesStore.moviesByLanguage.get(lang.code) ?? []).slice(0, 10)"
            :key="movie.id"
            :to="`/movies/${movie.id}`"
            class="flex-shrink-0 w-36 flex flex-col gap-1.5 cursor-pointer group"
          >
            <div
              v-if="movie.poster_url"
              class="w-full h-52 rounded-xl bg-surface-3 group-hover:ring-2 group-hover:ring-primary transition-all"
              :style="{
                backgroundImage: `url(${movie.poster_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }"
            ></div>
            <div
              v-else
              class="w-full h-52 rounded-xl bg-surface-3 flex items-center justify-center text-text-muted text-xs group-hover:ring-2 group-hover:ring-primary transition-all"
            >
              No Poster
            </div>
            <p class="text-xs font-medium text-text line-clamp-2 px-0.5">{{ movie.title }}</p>
            <p class="text-xs text-text-muted px-0.5">{{ movie.release_year || 'N/A' }}</p>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Add Language Dialog -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showAddDialog = false"
    >
      <div class="bg-surface-1 p-6 rounded-xl w-full max-w-sm flex flex-col gap-4">
        <h3 class="text-lg font-heading text-text">Add Language</h3>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text">Language Name *</label>
          <input
            v-model="newLanguage.name"
            type="text"
            placeholder="e.g., English"
            class="px-3 py-2 rounded-lg border border-border bg-surface-2 text-text text-sm"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text">Language Code *</label>
          <input
            v-model="newLanguage.code"
            type="text"
            placeholder="e.g., en"
            maxlength="3"
            class="px-3 py-2 rounded-lg border border-border bg-surface-2 text-text text-sm"
          />
          <small class="text-text-muted text-xs">2–3 lowercase letters (ISO 639)</small>
        </div>
        <div class="flex gap-3">
          <button
            @click="showAddDialog = false"
            class="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:text-text hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            @click="addLanguage"
            class="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useMainStore } from '@/stores/mainStore'
import { getErrorMessage } from '@/services/errorUtils'
import toastHandler from '@/composables/toastHandeler'

const languagesStore = useLanguagesStore()
const mainStore = useMainStore()

const showToast = toastHandler().showToast

const showAddDialog = ref(false)
const newLanguage = ref({ name: '', code: '' })

const allLoaded = computed(() =>
  languagesStore.languages.every((l) => !languagesStore.moviesLoadingMap.get(l.code)),
)

const populatedLanguages = computed(() =>
  languagesStore.languages.filter(
    (l) => (languagesStore.moviesByLanguage.get(l.code) ?? []).length > 0,
  ),
)

onMounted(async () => {
  if (!mainStore.backend.url) return
  // Only fetch languages list if not already loaded
  if (!languagesStore.languages.length) await languagesStore.fetchLanguages()
  // Only fetch movies for languages that haven't been fetched yet
  await Promise.all(
    languagesStore.languages
      .filter((l) => !languagesStore.moviesByLanguage.has(l.code))
      .map((l) => languagesStore.fetchMoviesByLanguage(l.code)),
  )
})

async function addLanguage() {
  if (!newLanguage.value.name || !newLanguage.value.code) {
    showToast('warn', 'Warning', 'Please fill all fields')
    return
  }
  try {
    await languagesStore.addLanguage(newLanguage.value.name, newLanguage.value.code)
    showAddDialog.value = false
    newLanguage.value = { name: '', code: '' }
    // Fetch movies for newly added language
    const added = languagesStore.languages[languagesStore.languages.length - 1]
    if (added) await languagesStore.fetchMoviesByLanguage(added.code)
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to add language'))
  }
}
</script>
