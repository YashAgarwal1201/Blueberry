<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-border rounded-xl overflow-y-auto"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text">
          {{ isEditMode ? 'Edit Person' : 'Add Person' }}
        </h1>
        <p class="font-content text-text-muted">
          {{ isEditMode ? "Update this person's details." : 'Add a new cast or crew member.' }}
        </p>
      </div>
      <RouterLink
        :to="isEditMode && personId ? `/people` : '/people'"
        class="px-4 py-2 rounded-lg border border-border text-text text-sm shrink-0"
      >
        Cancel
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col gap-3">
      <div v-for="n in 4" :key="n" class="h-12 rounded-lg bg-surface-3 animate-pulse" />
    </div>

    <!-- Form -->
    <form v-else class="flex flex-col gap-6" @submit.prevent="submitForm">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left column -->
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-text mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Full name"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              :class="{ '!border-red-500': errors.name }"
            />
            <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1">Also Known As</label>
            <input
              v-model="form.also_known_as"
              type="text"
              placeholder="Stage name, alias..."
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1">Bio</label>
            <textarea
              v-model="form.bio"
              rows="5"
              placeholder="Short biography"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">Birth Date</label>
              <input
                v-model="form.birth_date"
                type="text"
                placeholder="YYYY-MM-DD"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
              <small class="text-text-muted text-xs">Format: YYYY-MM-DD</small>
            </div>
            <div>
              <label class="block text-sm font-medium text-text mb-1">Birth Place</label>
              <input
                v-model="form.birth_place"
                type="text"
                placeholder="City, Country"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">IMDb ID</label>
              <input
                v-model="form.imdb_id"
                type="text"
                placeholder="nm0000093"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text mb-1">TMDB ID</label>
              <input
                v-model.number="form.tmdb_id"
                type="number"
                placeholder="12345"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-text mb-1">Profile Photo URL</label>
            <input
              v-model="form.profile_url"
              type="text"
              placeholder="https://example.com/photo.jpg"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
            <!-- Live preview -->
            <div v-if="form.profile_url" class="mt-3 flex items-center gap-3">
              <img
                :src="form.profile_url"
                alt="Profile preview"
                class="w-20 h-20 rounded-full object-cover ring-1 ring-border"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span class="text-xs text-text-muted">Preview</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons — matches MovieFormPage exactly -->
      <div class="flex gap-3">
        <button
          type="button"
          @click="resetForm"
          class="px-4 py-2 rounded-lg border border-border text-text"
        >
          Reset
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-60"
        >
          {{ saving ? 'Saving...' : isEditMode ? 'Update Person' : 'Add Person' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePeopleStore } from '@/stores/peopleStore'
import { useMainStore } from '@/stores/mainStore'
import apiClient from '@/services/apiInterceptors'
import toastHandler from '@/composables/toastHandeler'
import type { CreatePersonRequest, Person } from '@/types/movies'
import { getErrorMessage, getErrorStatus } from '@/services/errorUtils'

const route = useRoute()
const router = useRouter()
const peopleStore = usePeopleStore()
const mainStore = useMainStore()
const { showToast } = toastHandler()

const loading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const personId = computed(() => {
  const id = Number(route.params.id)
  return Number.isNaN(id) ? null : id
})

const isEditMode = computed(() => personId.value != null)

const createInitialForm = (): CreatePersonRequest => ({
  name: '',
  also_known_as: '',
  bio: '',
  birth_date: '',
  birth_place: '',
  profile_url: '',
  imdb_id: '',
  tmdb_id: undefined,
})

const form = ref<CreatePersonRequest>(createInitialForm())

function resetForm() {
  form.value = createInitialForm()
  errors.value = {}
}

function validate(): boolean {
  errors.value = {}
  if (!form.value.name?.trim()) {
    errors.value.name = 'Name is required'
  }
  return Object.keys(errors.value).length === 0
}

async function loadData() {
  if (!isEditMode.value || !personId.value) return
  loading.value = true
  try {
    const res = await apiClient.get(`people/${personId.value}`)
    const person = res.data.person
    form.value = {
      name: person.name,
      also_known_as: person.also_known_as ?? '',
      bio: person.bio ?? '',
      birth_date: person.birth_date ?? '',
      birth_place: person.birth_place ?? '',
      profile_url: person.profile_url ?? '',
      imdb_id: person.imdb_id ?? '',
      tmdb_id: person.tmdb_id,
    }
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to load person')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to load person data'))
    router.push('/people')
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  if (!validate()) return
  saving.value = true
  try {
    if (isEditMode.value && personId.value) {
      const res = await apiClient.put(`people/${personId.value}`, form.value)
      const updated = res.data.person as Person
      const idx = peopleStore.people.findIndex((p) => p.id === updated.id)
      if (idx !== -1) peopleStore.people[idx] = updated
      showToast('success', 'Updated', `${updated.name} updated successfully`)
    } else {
      const created = await peopleStore.createPerson(form.value)
      showToast('success', 'Added', `${created.name} added successfully`)
    }
    router.push('/people')
  } catch (err: unknown) {
    if (getErrorStatus(err) === 409) {
      showToast('warn', 'Duplicate', `"${form.value.name}" already exists.`)
    } else {
      showToast('error', 'Error', getErrorMessage(err, 'Failed to save person'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (!mainStore.backend.url) {
    router.push('/settings')
    return
  }
  loadData()
})
</script>
