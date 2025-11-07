<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="isEditMode ? 'Edit Movie' : 'Add New Movie'"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    class="!bg-slate-50 dark:!bg-slate-900 !text-slate-900 dark:!text-slate-100"
  >
    <div class="flex flex-col gap-4">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Title <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="form.title"
          placeholder="Enter movie title"
          class="w-full !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
          :class="{ '!border-red-500': errors.title }"
        />
        <small v-if="errors.title" class="text-red-500">{{ errors.title }}</small>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Description
        </label>
        <Textarea
          v-model="form.description"
          rows="3"
          placeholder="Enter movie description"
          class="w-full !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
        />
      </div>

      <!-- Year & Runtime -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Release Year
          </label>
          <InputNumber
            v-model="form.release_year"
            placeholder="2024"
            :useGrouping="false"
            :min="1800"
            :max="new Date().getFullYear() + 10"
            input-class="w-full !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Runtime (minutes)
          </label>
          <InputNumber
            v-model="form.runtime"
            placeholder="120"
            :useGrouping="false"
            :min="1"
            input-class="w-full !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
            class="w-full"
          />
        </div>
      </div>

      <!-- Director -->
      <div>
        <label class="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Director
        </label>
        <InputText
          v-model="form.director"
          placeholder="Enter director name"
          class="w-full !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
        />
      </div>

      <!-- Poster URL -->
      <div>
        <label class="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Poster URL
        </label>
        <InputText
          v-model="form.poster_url"
          placeholder="https://example.com/poster.jpg"
          class="w-full !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
        />
        <!-- Poster Preview -->
        <div v-if="form.poster_url" class="mt-2">
          <img
            :src="form.poster_url"
            alt="Poster preview"
            class="w-32 h-48 object-cover rounded-lg"
            @error="posterError = true"
          />
          <small v-if="posterError" class="text-orange-500">
            Failed to load image. Check the URL.
          </small>
        </div>
      </div>

      <!-- Languages -->
      <div>
        <label class="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Languages
        </label>
        <MultiSelect
          v-model="form.language_ids"
          :options="languagesStore.languages"
          optionLabel="name"
          optionValue="id"
          placeholder="Select languages"
          display="chip"
          class="w-full !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
          :loading="languagesStore.loading"
        />
        <small class="text-slate-500">Select one or more languages</small>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <Button
          label="Cancel"
          icon="pi pi-times"
          severity="secondary"
          @click="closeDialog"
          class="flex-1 !bg-transparent border !border-slate-200 dark:!border-slate-700 !text-slate-700 dark:!text-slate-300"
        />
        <Button
          :label="isEditMode ? 'Update' : 'Add Movie'"
          icon="pi pi-check"
          @click="handleSubmit"
          :loading="submitting"
          class="flex-1 !bg-indigo-700 dark:!bg-indigo-600 !text-white border !border-indigo-700 dark:!border-indigo-600"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import MultiSelect from 'primevue/multiselect'
import Button from 'primevue/button'
import { useMoviesStore } from '@/stores/moviesStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import type { CreateMovieRequest, UpdateMovieRequest, MovieWithLanguages } from '@/types/movies'

// Props
interface Props {
  visible: boolean
  movie?: MovieWithLanguages | null // If provided, it's edit mode
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  movie: null,
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'movie-added': [movie: MovieWithLanguages]
  'movie-updated': [movie: MovieWithLanguages]
}>()

// Stores
const moviesStore = useMoviesStore()
const languagesStore = useLanguagesStore()

// Local state
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const isEditMode = computed(() => !!props.movie)

const form = ref<CreateMovieRequest | UpdateMovieRequest>({
  title: '',
  description: '',
  release_year: undefined,
  director: '',
  poster_url: '',
  runtime: undefined,
  language_ids: [],
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const posterError = ref(false)

// Watch for movie changes (edit mode)
watch(
  () => props.movie,
  (movie) => {
    if (movie) {
      form.value = {
        title: movie.title,
        description: movie.description || '',
        release_year: movie.release_year,
        director: movie.director || '',
        poster_url: movie.poster_url || '',
        runtime: movie.runtime,
        language_ids: movie.languages.map((l) => l.id),
      }
    } else {
      resetForm()
    }
    errors.value = {}
    posterError.value = false
  },
  { immediate: true },
)

// Watch poster URL for error reset
watch(
  () => form.value.poster_url,
  () => {
    posterError.value = false
  },
)

function resetForm() {
  form.value = {
    title: '',
    description: '',
    release_year: undefined,
    director: '',
    poster_url: '',
    runtime: undefined,
    language_ids: [],
  }
  errors.value = {}
  posterError.value = false
}

function validate(): boolean {
  errors.value = {}

  if (!form.value.title?.trim()) {
    errors.value.title = 'Title is required'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true

  try {
    if (isEditMode.value && props.movie) {
      // Update existing movie
      const updated = await moviesStore.updateMovie(props.movie.id, form.value)
      emit('movie-updated', updated)
    } else {
      // Add new movie
      const newMovie = await moviesStore.addMovie(form.value as CreateMovieRequest)
      emit('movie-added', newMovie)
    }

    closeDialog()
    resetForm()
  } catch (err: any) {
    errors.value.general = err.message || 'Failed to save movie'
  } finally {
    submitting.value = false
  }
}

function closeDialog() {
  isVisible.value = false
  resetForm()
}
</script>

<style scoped>
:deep(.p-dialog-header) {
  @apply bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700;
}

:deep(.p-dialog-content) {
  @apply bg-slate-50 dark:bg-slate-900;
}

:deep(.p-dialog-footer) {
  @apply bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700;
}
</style>
