<template>
  <div class="flex flex-col gap-y-6 max-w-4xl pb-10">
    <div class="flex flex-col gap-1">
      <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">App Preferences</h2>
      <p class="font-content text-text-muted">Configure what appears on your home page and customize your browsing
        experience.</p>
    </div>

    <div v-if="!authStore.isAuthenticated"
      class="bg-surface-1 p-8 rounded-3xl border border-border text-center shadow-lg">
      <div
        class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 border border-primary/20">
        <UserCircle :size="32" class="text-primary" />
      </div>
      <h3 class="text-xl font-heading font-bold mb-3">Login Required</h3>
      <p class="text-text-muted font-content mb-6 max-w-md mx-auto leading-relaxed">
        You must be logged in to customise your app experience. Your preferences will be saved securely to your account
        and synced across all your devices.
      </p>
      <RouterLink to="/login"
        class="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold inline-flex items-center hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
        Log In Now
      </RouterLink>
    </div>

    <div v-else class="flex flex-col gap-y-8">

      <!-- Section 1: Content Types -->
      <section class="flex flex-col gap-y-4">
        <div class="flex flex-col">
          <h3 class="text-lg font-heading font-bold text-text">Content Visibility</h3>
          <p class="text-sm text-text-muted">Choose the primary content categories you want to see across the app.</p>
        </div>
        <div class="bg-surface-1 border border-border rounded-3xl p-2 flex flex-col shadow-sm">

          <div
            class="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-2 transition-colors cursor-pointer group"
            @click="localPrefs.showMovies = !localPrefs.showMovies">
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full bg-surface-2 group-hover:bg-surface-3 flex items-center justify-center text-primary transition-colors">
                <Film :size="20" />
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-text">Movies</span>
                <span class="text-sm text-text-muted">Show movies on the homepage and navigation menus.</span>
              </div>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shrink-0 border border-white/5 shadow-inner"
              :class="localPrefs.showMovies ? 'bg-primary' : 'bg-surface-3'">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                :class="localPrefs.showMovies ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

          <div class="h-px w-full bg-border/50 my-1"></div>

          <div
            class="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-2 transition-colors cursor-pointer group"
            @click="localPrefs.showShows = !localPrefs.showShows">
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full bg-surface-2 group-hover:bg-surface-3 flex items-center justify-center text-primary transition-colors">
                <Tv :size="20" />
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-text">TV Shows</span>
                <span class="text-sm text-text-muted">Show TV series on the homepage and navigation menus.</span>
              </div>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shrink-0 border border-white/5 shadow-inner"
              :class="localPrefs.showShows ? 'bg-primary' : 'bg-surface-3'">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                :class="localPrefs.showShows ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

          <div class="h-px w-full bg-border/50 my-1"></div>

          <div
            class="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-2 transition-colors cursor-pointer group"
            @click="localPrefs.showPeople = !localPrefs.showPeople">
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full bg-surface-2 group-hover:bg-surface-3 flex items-center justify-center text-primary transition-colors">
                <Users :size="20" />
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-text">People</span>
                <span class="text-sm text-text-muted">Show actors, directors, and crew members.</span>
              </div>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shrink-0 border border-white/5 shadow-inner"
              :class="localPrefs.showPeople ? 'bg-primary' : 'bg-surface-3'">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                :class="localPrefs.showPeople ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

        </div>
      </section>

      <!-- Section 2: Details Pages -->
      <section class="flex flex-col gap-y-4">
        <div class="flex flex-col">
          <h3 class="text-lg font-heading font-bold text-text">Page Layouts</h3>
          <p class="text-sm text-text-muted">Customize the information displayed on individual pages.</p>
        </div>
        <div class="bg-surface-1 border border-border rounded-3xl p-2 flex flex-col shadow-sm">

          <div
            class="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-2 transition-colors cursor-pointer group"
            @click="localPrefs.showCastDetails = !localPrefs.showCastDetails">
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full bg-surface-2 group-hover:bg-surface-3 flex items-center justify-center text-primary transition-colors">
                <Contact :size="20" />
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-text">Show Cast & Crew</span>
                <span class="text-sm text-text-muted">Display cast carousels on movie and show details pages.</span>
              </div>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shrink-0 border border-white/5 shadow-inner"
              :class="localPrefs.showCastDetails ? 'bg-primary' : 'bg-surface-3'">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                :class="localPrefs.showCastDetails ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>

        </div>
      </section>

      <!-- Section 3: Content Filters -->
      <section class="flex flex-col gap-y-4">
        <div class="flex flex-col">
          <h3 class="text-lg font-heading font-bold text-text">Content Filtering</h3>
          <p class="text-sm text-text-muted">Select genres and languages to completely hide from your recommendations
            and browsing.</p>
        </div>

        <div class="bg-surface-1 border border-border rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
          <div class="flex flex-col gap-y-3">
            <label class="font-bold text-text flex items-center gap-2">
              <Filter :size="18" class="text-primary" /> Blocked Genres
            </label>
            <MultiSelect v-model="localPrefs.blockedGenres" :options="genresStore.genres" optionLabel="name"
              optionValue="slug" placeholder="Select genres to block (e.g., Horror, Romance)"
              class="w-full bg-surface-2 border-border" display="chip" :maxSelectedLabels="10" filter />
          </div>

          <div class="h-px w-full bg-border/50"></div>

          <div class="flex flex-col gap-y-3">
            <label class="font-bold text-text flex items-center gap-2">
              <Languages :size="18" class="text-primary" /> Blocked Languages
            </label>
            <MultiSelect v-model="localPrefs.blockedLanguages" :options="languagesStore.languages" optionLabel="name"
              optionValue="code" placeholder="Select languages to block" class="w-full bg-surface-2 border-border"
              display="chip" :maxSelectedLabels="10" filter />
          </div>
        </div>
      </section>

      <!-- Action Footer -->
      <div class="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button v-if="hasChanges" @click="cancelChanges" :disabled="isSaving"
          class="px-6 py-3 rounded-xl font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-all disabled:opacity-50 disabled:pointer-events-none">
          Cancel
        </button>
        <button @click="saveChanges" :disabled="isSaving || !hasChanges"
          class="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none">
          <Loader2 v-if="isSaving" class="animate-spin" :size="20" />
          <Save v-else :size="20" />
          {{ isSaving ? 'Saving...' : 'Save Preferences' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { MultiSelect } from 'primevue'
import { UserCircle, Film, Tv, Users, Contact, Filter, Languages, Save, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useGenresStore } from '@/stores/genresStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import toastHandler from '@/composables/toastHandeler'

const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const genresStore = useGenresStore()
const languagesStore = useLanguagesStore()
const { showToast } = toastHandler()

const isSaving = ref(false)

const localPrefs = reactive({
  showMovies: preferencesStore.showMovies,
  showShows: preferencesStore.showShows,
  showPeople: preferencesStore.showPeople,
  showCastDetails: preferencesStore.showCastDetails,
  blockedGenres: [...preferencesStore.blockedGenres],
  blockedLanguages: [...preferencesStore.blockedLanguages],
})

const initLocalPrefs = () => {
  localPrefs.showMovies = preferencesStore.showMovies
  localPrefs.showShows = preferencesStore.showShows
  localPrefs.showPeople = preferencesStore.showPeople
  localPrefs.showCastDetails = preferencesStore.showCastDetails
  localPrefs.blockedGenres = [...preferencesStore.blockedGenres]
  localPrefs.blockedLanguages = [...preferencesStore.blockedLanguages]
}

watch(() => preferencesStore.isFetching, (isFetching) => {
  if (!isFetching) initLocalPrefs()
})

const hasChanges = computed(() => {
  return localPrefs.showMovies !== preferencesStore.showMovies ||
    localPrefs.showShows !== preferencesStore.showShows ||
    localPrefs.showPeople !== preferencesStore.showPeople ||
    localPrefs.showCastDetails !== preferencesStore.showCastDetails ||
    JSON.stringify(localPrefs.blockedGenres) !== JSON.stringify(preferencesStore.blockedGenres) ||
    JSON.stringify(localPrefs.blockedLanguages) !== JSON.stringify(preferencesStore.blockedLanguages)
})

const cancelChanges = () => {
  initLocalPrefs()
}

const saveChanges = async () => {
  if (!hasChanges.value) return
  isSaving.value = true

  // Push changes to store first so the app UI responds
  preferencesStore.showMovies = localPrefs.showMovies
  preferencesStore.showShows = localPrefs.showShows
  preferencesStore.showPeople = localPrefs.showPeople
  preferencesStore.showCastDetails = localPrefs.showCastDetails
  preferencesStore.blockedGenres = [...localPrefs.blockedGenres]
  preferencesStore.blockedLanguages = [...localPrefs.blockedLanguages]

  try {
    const success = await preferencesStore.savePreferences()
    if (success) {
      showToast('success', 'Preferences Saved', 'Your app preferences have been successfully updated.')
    } else {
      showToast('error', 'Save Failed', 'There was a problem saving your preferences.')
    }
  } catch (error) {
    console.error("Error while saving preferences", error)
    showToast('error', 'Save Failed', 'An unexpected error occurred. Please check console for more details.')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  initLocalPrefs()

  if (genresStore.genres.length === 0) {
    genresStore.fetchGenres().catch(console.error)
  }
  if (languagesStore.languages.length === 0) {
    languagesStore.fetchLanguages().catch(console.error)
  }
})
</script>
