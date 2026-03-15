<template>
  <div class="w-full h-full flex flex-col border border-border rounded-xl overflow-hidden">
    <!-- ── Header ── -->
    <div class="flex items-center justify-between p-2 sm:p-3 shrink-0">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text">People</h1>
        <p class="font-content text-text-muted hidden sm:block">
          Manage actors, directors and crew
        </p>
      </div>
      <!-- Header button: was @click="showAddDialog = true" -->
      <RouterLink
        to="/people/add"
        class="px-3 py-2 rounded-lg bg-primary text-on-primary text-sm flex items-center gap-1.5 shrink-0"
      >
        <Plus :size="15" />
        <span>Add Person</span>
      </RouterLink>
    </div>

    <!-- ── Sticky filter bar ── -->
    <div
      class="sticky top-0 z-10 bg-surface-0 border-b border-border px-2 sm:px-3 py-2 flex flex-col gap-2 shrink-0"
    >
      <!-- Search row -->
      <div class="relative">
        <Search
          :size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or alias..."
          class="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-surface-1 text-text text-sm placeholder:text-text-muted"
        />
        <button
          v-if="searchQuery"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          @click="searchQuery = ''"
        >
          <X :size="14" />
        </button>
      </div>

      <!-- Role filter chips row -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        <button
          v-for="role in roleOptions"
          :key="role.value"
          class="shrink-0 px-2.5 py-1 rounded-full text-xs border transition-colors"
          :class="
            selectedRole === role.value
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-1 text-text-muted border-border hover:border-primary/50'
          "
          @click="selectedRole = role.value"
        >
          {{ role.label }}
        </button>

        <!-- Clear — only when role or search is active -->
        <button
          v-if="hasActiveFilters"
          class="shrink-0 ml-auto text-xs text-primary underline whitespace-nowrap"
          @click="clearFilters"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- ── Scrollable body ── -->
    <div class="flex-1 overflow-y-auto p-2 sm:p-3">
      <!-- Count -->
      <p v-if="!peopleStore.loading" class="text-xs text-text-muted mb-3">
        {{ filteredPeople.length }} person{{ filteredPeople.length !== 1 ? 's' : '' }}
        <template v-if="hasActiveFilters"> — filtered</template>
      </p>

      <!-- Skeletons -->
      <div v-if="peopleStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="n in 6"
          :key="n"
          class="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-1 border border-border"
        >
          <div class="w-11 h-11 rounded-full bg-surface-3 animate-pulse shrink-0" />
          <div class="flex flex-col gap-2 flex-1">
            <div class="h-3 rounded bg-surface-3 animate-pulse w-2/3" />
            <div class="h-3 rounded bg-surface-3 animate-pulse w-1/3" />
          </div>
        </div>
      </div>

      <!-- No backend -->
      <div
        v-else-if="!mainStore.backend.url"
        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <span class="text-4xl">🔌</span>
        <p class="text-text font-medium">No backend selected.</p>
        <RouterLink to="/settings" class="text-sm text-primary underline"
          >Go to Settings</RouterLink
        >
      </div>

      <!-- Empty -->
      <div
        v-else-if="filteredPeople.length === 0"
        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <span class="text-4xl">🎭</span>
        <p class="text-text font-medium">
          {{ hasActiveFilters ? 'No people match your filters.' : 'No people added yet.' }}
        </p>
        <p class="text-text-muted text-sm">
          {{
            hasActiveFilters
              ? 'Try adjusting or clearing the filters.'
              : 'Add cast and crew members to get started.'
          }}
        </p>
        <button
          v-if="hasActiveFilters"
          class="text-sm text-primary underline"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="person in filteredPeople"
          :key="person.id"
          type="button"
          class="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-1 border border-border hover:border-primary/50 hover:bg-surface-2 transition-colors text-left group w-full"
          @click="openProfile(person)"
        >
          <!-- Avatar -->
          <img
            v-if="person.profile_url"
            :src="person.profile_url"
            :alt="person.name"
            class="w-11 h-11 rounded-full object-cover shrink-0 ring-1 ring-border"
          />
          <div
            v-else
            class="w-11 h-11 rounded-full bg-surface-3 flex items-center justify-center shrink-0 ring-1 ring-border"
          >
            <User :size="18" class="text-text-muted" />
          </div>

          <!-- Text -->
          <div class="flex flex-col min-w-0 flex-1">
            <span class="text-sm font-medium text-text truncate">{{ person.name }}</span>
            <!-- Priority: aka > birth_place > credit count -->
            <span v-if="person.also_known_as" class="text-xs text-text-muted truncate">
              aka {{ person.also_known_as }}
            </span>
            <span v-else-if="person.birth_place" class="text-xs text-text-muted truncate">
              {{ person.birth_place }}
            </span>
            <span v-else class="text-xs text-text-muted">
              {{ creditCount(person.id) }} credit{{ creditCount(person.id) !== 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Role badge — shown when a role filter is active -->
          <span
            v-if="selectedRole"
            class="shrink-0 px-2 py-0.5 rounded-full bg-primary-subtle text-primary text-xs capitalize"
          >
            {{ selectedRole }}
          </span>

          <ChevronRight
            :size="15"
            class="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>
      </div>
    </div>
  </div>

  <!-- Profile Drawer -->
  <PersonProfileDrawer
    v-model:visible="showProfile"
    :person="selectedPerson"
    :filmography="filmography"
    :filmography-loading="filmographyLoading"
    :filmography-loaded="filmographyLoaded"
    :saving="saving"
    :deleting="deleting"
    @load-filmography="loadFilmography"
    @save="saveEdit"
    @delete="confirmDelete"
    @edit="onEditPerson"
  />

  <!-- Add Dialog -->
  <PersonAddDialog
    v-model:visible="showAddDialog"
    :loading="peopleStore.creating"
    @submit="submitAdd"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
// import { Button } from 'primevue'
import { useConfirm } from 'primevue/useconfirm'
import { ChevronRight, Search, User, X } from 'lucide-vue-next'
import { usePeopleStore } from '@/stores/peopleStore'
import { useMoviesStore } from '@/stores/moviesStore'
import { useMainStore } from '@/stores/mainStore'
import apiClient from '@/services/apiInterceptors'
import toastHandler from '@/composables/toastHandeler'
import PersonProfileDrawer from '@/components/people/PersonProfileDrawer.vue'
import PersonAddDialog from '@/components/people/PersonAddDialog.vue'
import type { CreatePersonRequest, Person, CastRole } from '@/types/movies'
import router from '@/router'
import { getErrorMessage, getErrorStatus } from '@/services/errorUtils'

const peopleStore = usePeopleStore()
const moviesStore = useMoviesStore()
const mainStore = useMainStore()
const { showToast } = toastHandler()
const confirm = useConfirm()

// ── Role filter ───────────────────────────────────────────────────────────────
type RoleFilter = CastRole | ''

const roleOptions: { label: string; value: RoleFilter }[] = [
  { label: 'All', value: '' },
  { label: 'Actor', value: 'actor' },
  { label: 'Director', value: 'director' },
  { label: 'Writer', value: 'writer' },
  { label: 'Producer', value: 'producer' },
]

const selectedRole = ref<RoleFilter>('')

// Map person.id → Set of roles across all loaded movies — purely client-side
const personRolesMap = computed(() => {
  const map = new Map<number, Set<CastRole>>()
  for (const movie of moviesStore.movies) {
    for (const member of movie.cast) {
      if (!map.has(member.id)) map.set(member.id, new Set())
      map.get(member.id)!.add(member.role)
    }
  }
  return map
})

function creditCount(personId: number): number {
  // Count distinct movies this person appears in
  let count = 0
  for (const movie of moviesStore.movies) {
    if (movie.cast.some((c) => c.id === personId)) count++
  }
  return count
}

// ── Search ────────────────────────────────────────────────────────────────────
const searchQuery = ref('')

// ── Derived filtered list — 100% client-side, instant ────────────────────────
const filteredPeople = computed(() => {
  let list = peopleStore.people

  // Text search
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.also_known_as?.toLowerCase().includes(q) ||
        p.birth_place?.toLowerCase().includes(q),
    )
  }

  // Role filter — cross-reference against moviesStore cast
  if (selectedRole.value) {
    list = list.filter((p) => personRolesMap.value.get(p.id)?.has(selectedRole.value as CastRole))
  }

  return list
})

const hasActiveFilters = computed(() => !!searchQuery.value.trim() || !!selectedRole.value)

function clearFilters() {
  searchQuery.value = ''
  selectedRole.value = ''
}

// ── Profile drawer ────────────────────────────────────────────────────────────
const showProfile = ref(false)
const selectedPerson = ref<Person | null>(null)

type FilmographyEntry = {
  id: number
  title: string
  release_year: number | null
  poster_url: string | null
  role: string
  character: string | null
}
const filmography = ref<FilmographyEntry[]>([])
const filmographyLoading = ref(false)
const filmographyLoaded = ref(false)

function openProfile(person: Person) {
  selectedPerson.value = person
  filmography.value = []
  filmographyLoaded.value = false
  showProfile.value = true
}

async function loadFilmography() {
  if (!selectedPerson.value) return
  filmographyLoading.value = true
  try {
    const res = await apiClient.get(`people/${selectedPerson.value.id}`)
    filmography.value = res.data.person.filmography || []
    filmographyLoaded.value = true
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to load filmography')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to load filmography'))
  } finally {
    filmographyLoading.value = false
  }
}

// ── Edit ──────────────────────────────────────────────────────────────────────
const saving = ref(false)

async function saveEdit(form: CreatePersonRequest) {
  if (!selectedPerson.value) return
  saving.value = true
  try {
    const res = await apiClient.put(`people/${selectedPerson.value.id}`, form)
    const updated: Person = res.data.person
    const idx = peopleStore.people.findIndex((p) => p.id === updated.id)
    if (idx !== -1) peopleStore.people[idx] = updated
    selectedPerson.value = updated
    showToast('success', 'Saved', `${updated.name} updated successfully`)
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to save changes')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to save changes'))
  } finally {
    saving.value = false
  }
}

function onEditPerson() {
  if (!selectedPerson.value) return
  showProfile.value = false
  router.push(`/people/${selectedPerson.value.id}/edit`)
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleting = ref(false)

function confirmDelete() {
  if (!selectedPerson.value) return
  confirm.require({
    message: `Delete "${selectedPerson.value.name}"? This cannot be undone. Deletion is blocked if they are credited in any movies.`,
    header: 'Delete Person',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      if (!selectedPerson.value) return
      deleting.value = true
      try {
        await apiClient.delete(`people/${selectedPerson.value.id}`)
        peopleStore.people = peopleStore.people.filter((p) => p.id !== selectedPerson.value!.id)
        showToast('success', 'Deleted', `${selectedPerson.value.name} removed`)
        showProfile.value = false
      } catch (err: unknown) {
        if (getErrorStatus(err) === 409) {
          showToast(
            'warn',
            'Cannot Delete',
            getErrorMessage(err, 'This person is credited in movies.'),
          )
        } else {
          showToast('error', 'Error', getErrorMessage(err, 'Failed to delete person'))
        }
      } finally {
        deleting.value = false
      }
    },
  })
}

// ── Add ───────────────────────────────────────────────────────────────────────
const showAddDialog = ref(false)

async function submitAdd(personForm: CreatePersonRequest) {
  try {
    const created = await peopleStore.createPerson(personForm)
    showToast('success', 'Added', `${created.name} added successfully`)
    showAddDialog.value = false
  } catch (err: unknown) {
    if (getErrorStatus(err) === 409) {
      showToast(
        'warn',
        'Duplicate',
        `"${personForm.name}" already exists. Search for them instead.`,
      )
    } else {
      showToast('error', 'Error', getErrorMessage(err, 'Failed to add person'))
    }
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!mainStore.backend.url) return
  // Fetch people + ensure movies are loaded (needed for role map + credit counts)
  await Promise.all([
    peopleStore.fetchPeople(),
    moviesStore.movies.length === 0 ? moviesStore.fetchMovies() : Promise.resolve(),
  ])
})
</script>
