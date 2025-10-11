<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
        Dashboard
      </h1>
      <p class="font-content text-slate-600 dark:text-slate-400">View your movies collection.</p>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col gap-y-3 p-2 sm:p-3 bg-blue-50 dark:bg-slate-800 rounded-lg">
      <div class="flex flex-row items-center gap-x-2 md:gap-x-3">
        <!-- Global Search -->
        <InputText
          v-model="globalFilter"
          placeholder="Search your movie"
          class="w-full h-9 flex-grow !rounded-lg !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
        />

        <div class="flex-shrink-0 flex gap-x-2 md:gap-x-3">
          <!-- Add Movie -->
          <Button
            class="h-9 flex items-center justify-center gap-x-2 rounded-lg !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700 !text-slate-700 dark:!text-white"
            @click="openAddDialog"
          >
            <Plus :size="16" />
            <span class="hidden sm:block">Add Movie</span>
          </Button>

          <!-- Download Data -->
          <Button
            class="h-9 flex items-center justify-center gap-x-2 rounded-lg !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700 !text-slate-700 dark:!text-white"
            @click="downloadMovies"
          >
            <Download :size="16" />
            <span class="hidden sm:block">Download Data</span>
          </Button>
        </div>
      </div>

      <!-- DataTable -->
      <DataTable
        :value="movies"
        :filters="filters"
        :globalFilterFields="['title', 'description']"
        dataKey="id"
        paginator
        :rows="10"
        :loading="moviesStore.loading"
        class="p-datatable-gridlines !rounded-xl"
      >
        <Column field="id" header="ID" style="width: 90px" sortable class="w-24" />
        <Column field="title" header="Title" sortable class="w-2xs" />
        <Column field="description" header="Description" class="w-2xs" />

        <!-- Actions -->
        <Column
          header="Actions"
          headerStyle="width:160px; text-align:center"
          bodyStyle="text-align:center"
        >
          <template #body="{ data }">
            <div class="w-full flex gap-x-3">
              <Button
                icon="pi pi-pencil"
                class="p-button-text p-button-sm"
                @click="openEditDialog(data)"
                title="Edit"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-text p-button-sm p-button-danger"
                @click="confirmDelete(data.id)"
                title="Delete"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Back button -->
    <div class="mt-auto flex justify-start">
      <RouterLink
        to="/"
        class="px-4 py-2 rounded-full flex items-center justify-center gap-x-2 cursor-pointer bg-indigo-700 dark:bg-indigo-600 text-white"
      >
        Go Back
      </RouterLink>
    </div>

    <!-- Add/Edit Movie Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="dialogMode === 'add' ? 'Add Movie' : 'Edit Movie'"
      modal
      :style="{ width: '400px' }"
      dismissable-mask
      class="rounded-lg !bg-slate-50 dark:!bg-slate-900 !text-slate-900 dark:!text-slate-100 font-content border !border-blue-300 dark:!border-indigo-800"
    >
      <template #header>
        <h3 class="text-lg sm:text-xl font-heading font-semibold">
          {{ dialogMode === 'add' ? 'Add Movie' : 'Edit Movie' }}
        </h3>
      </template>
      <div class="flex flex-col gap-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Title</label>
          <InputText
            v-model="movieForm.title"
            placeholder="Enter movie title"
            class="w-full h-9 flex-grow !rounded-lg !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <InputText
            v-model="movieForm.description"
            placeholder="Enter movie description"
            class="w-full h-9 flex-grow !rounded-lg !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          :outlined="true"
          class="!text-white dark:!text-white border !border-slate-200 dark:!border-slate-700 h-9"
          @click="dialogVisible = false"
        />
        <Button
          :label="dialogMode === 'add' ? 'Add' : 'Update'"
          icon="pi pi-check"
          class="h-9 flex items-center justify-center gap-x-2 cursor-pointer !bg-indigo-700 dark:!bg-indigo-600 !text-white border !border-indigo-700 dark:!border-indigo-600"
          @click="saveMovie"
        />
      </template>
    </Dialog>

    <!-- Confirm Delete -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useMoviesStore } from '@/stores/moviesStore'
import { useMainStore } from '@/stores/mainStore'
import { useRouter, RouterLink } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import toastHandler from '@/composables/toastHandeler'
import { Download, Plus } from 'lucide-vue-next'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import type { Movie } from '@/stores/moviesStore'

const moviesStore = useMoviesStore()
const mainStore = useMainStore()
const router = useRouter()
const confirm = useConfirm()
const showToast = toastHandler().showToast

// Global filter
const globalFilter = ref<string | null>(null)
const filters = ref({
  global: { value: '', matchMode: FilterMatchMode.CONTAINS },
  title: { value: '', matchMode: FilterMatchMode.CONTAINS },
  description: { value: '', matchMode: FilterMatchMode.CONTAINS },
})

watch(globalFilter, (val) => {
  filters.value.global.value = val ?? ''
})

// Reactive movie list
const movies = computed(() => moviesStore.movies)

// Lifecycle
onMounted(() => {
  if (mainStore.backend.url?.trim() !== '') {
    if (movies.value.length < 1) moviesStore.fetchMoviesList()
  } else {
    showToast('warn', 'Warning', 'No backend selected. Navigating to home page.')
    router.push('/')
  }
})

onMounted(() => {
  const checkInterval = setInterval(async () => {
    const isAlive = await mainStore.checkBackendHealth(mainStore.backend.url)
    if (!isAlive) {
      showToast('error', 'Disconnected', 'Backend went offline. Redirecting home...')
      router.push('/')
    }
  }, 10000) // check every 10s

  onUnmounted(() => clearInterval(checkInterval))
})

// Dialog state
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const movieForm = ref<Partial<Movie>>({ title: '', description: '' })
let editingMovieId: string | null = null

// Open dialogs
function openAddDialog() {
  dialogMode.value = 'add'
  movieForm.value = { title: '', description: '' }
  dialogVisible.value = true
}

function openEditDialog(movie: Movie) {
  dialogMode.value = 'edit'
  editingMovieId = movie.id
  movieForm.value = { title: movie.title, description: movie.description }
  dialogVisible.value = true
}

// Save or update
async function saveMovie() {
  if (!movieForm.value.title?.trim()) {
    showToast('warn', 'Validation', 'Title is required.')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await moviesStore.addMovie({
        title: movieForm.value.title,
        description: movieForm.value.description,
      })
      showToast('success', 'Success', 'Movie added successfully.')
    } else if (editingMovieId) {
      await moviesStore.updateMovie(editingMovieId, {
        title: movieForm.value.title,
        description: movieForm.value.description,
      })
      showToast('success', 'Success', 'Movie updated successfully.')
    }
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
    showToast('error', 'Error', 'Failed to save movie.')
  }
}

// Confirm delete
function confirmDelete(id: string) {
  confirm.require({
    message: 'Are you sure you want to delete this movie?',
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: '!text-white border !border-red-500 !bg-red-500 h-9',
    rejectClass:
      '!text-white dark:!text-white !bg-transparent border !border-slate-200 dark:!border-slate-700 h-9',
    accept: async () => {
      await moviesStore.deleteMovie(id)
      showToast('success', 'Deleted', 'Movie deleted successfully.')
    },
  })
}

// Download movies as JSON
function downloadMovies() {
  const data = JSON.stringify(movies.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'movies.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
:deep(.p-dialog-header) {
  font-weight: 600;
}
</style>
