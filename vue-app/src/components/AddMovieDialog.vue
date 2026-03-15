<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="isEditMode ? 'Edit Movie' : 'Add New Movie'"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    class="!bg-surface-1 !text-text"
  >
    <div class="flex flex-col gap-4">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium mb-2 text-text">
          Title <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="form.title"
          placeholder="Enter movie title"
          class="w-full !bg-surface-2 !border-border"
          :class="{ '!border-red-500': errors.title }"
        />
        <small v-if="errors.title" class="text-red-500">{{ errors.title }}</small>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium mb-2 text-text"> Description </label>
        <Textarea
          v-model="form.description"
          rows="3"
          placeholder="Enter movie description"
          class="w-full !bg-surface-2 !border-border"
        />
      </div>

      <!-- Year & Runtime -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2 text-text"> Release Year </label>
          <InputNumber
            v-model="form.release_year"
            placeholder="2024"
            :useGrouping="false"
            :min="1800"
            :max="new Date().getFullYear() + 10"
            input-class="w-full !bg-surface-2 !border-border"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-text"> Runtime (minutes) </label>
          <InputNumber
            v-model="form.runtime"
            placeholder="120"
            :useGrouping="false"
            :min="1"
            input-class="w-full !bg-surface-2 !border-border"
            class="w-full"
          />
        </div>
      </div>

      <!-- Director -->
      <div>
        <label class="block text-sm font-medium mb-2 text-text"> Director </label>
        <InputText
          v-model="form.director"
          placeholder="Enter director name"
          class="w-full !bg-surface-2 !border-border"
        />
      </div>

      <!-- Poster URL -->
      <div>
        <label class="block text-sm font-medium mb-2 text-text"> Poster URL </label>
        <InputText
          v-model="form.poster_url"
          placeholder="https://example.com/poster.jpg"
          class="w-full !bg-surface-2 !border-border"
        />
        <!-- Poster Preview -->
        <div v-if="form.poster_url" class="mt-2">
          <img
            loading="lazy"
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
        <label class="block text-sm font-medium mb-2 text-text"> Languages </label>
        <MultiSelect
          v-model="form.language_ids"
          :options="languagesStore.languages"
          optionLabel="name"
          optionValue="id"
          placeholder="Select languages"
          display="chip"
          class="w-full !bg-surface-2 !border-border"
          :loading="languagesStore.loading"
        />
        <small class="text-text-muted">Select one or more languages</small>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <Button
          label="Cancel"
          icon="pi pi-times"
          severity="secondary"
          @click="closeDialog"
          class="flex-1 !bg-transparent !border-border !text-text"
        />
        <Button
          :label="isEditMode ? 'Update' : 'Add Movie'"
          icon="pi pi-check"
          @click="handleSubmit"
          :loading="submitting"
          class="flex-1 !bg-primary !text-on-primary !border-primary"
        />
      </div>
    </template>
  </Dialog>
</template>

<!-- script block unchanged -->
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
import { getErrorMessage } from '@/services/errorUtils'

interface Props {
  visible: boolean
  movie?: MovieWithLanguages | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  movie: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'movie-added': [movie: MovieWithLanguages]
  'movie-updated': [movie: MovieWithLanguages]
}>()

const moviesStore = useMoviesStore()
const languagesStore = useLanguagesStore()

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
      const updated = await moviesStore.updateMovie(props.movie.id, form.value)
      emit('movie-updated', updated)
    } else {
      const newMovie = await moviesStore.addMovie(form.value as CreateMovieRequest)
      emit('movie-added', newMovie)
    }
    closeDialog()
    resetForm()
  } catch (err: unknown) {
    const message = getErrorMessage(err, 'Failed to save movie')
    errors.value.general = message
  } finally {
    submitting.value = false
  }
}

function closeDialog() {
  isVisible.value = false
  resetForm()
}
</script>

<!-- <style scoped>
:deep(.p-dialog-header) {
  @apply bg-surface-1 border-b border-border;
}
:deep(.p-dialog-content) {
  @apply bg-surface-1;
}
:deep(.p-dialog-footer) {
  @apply bg-surface-1 border-t border-border;
}
</style> -->
