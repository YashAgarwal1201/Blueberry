<template>
  <div class="w-full h-full p-0 flex flex-col gap-y-6 md:gap-y-8 rounded-xl">
    <!-- Toolbar -->
    <div
      class="flex-grow flex flex-col gap-y-3 p-2 sm:p-3 bg-blue-50 dark:bg-slate-800 rounded-lg min-h-0"
    >
      <div class="flex-shrink-0 flex flex-row items-center gap-x-2 md:gap-x-3">
        <!-- Global Search -->
        <InputText
          v-model="globalFilter"
          placeholder="Search your movie"
          class="w-full h-9 flex-grow !rounded-lg !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700"
        />

        <div class="flex-shrink-0 flex gap-x-2 md:gap-x-3">
          <!-- Add Movie -->
          <RouterLink
            :to="'/movies/add'"
            class="p-button h-9 flex items-center justify-center gap-x-2 rounded-lg !bg-blue-100 dark:!bg-indigo-950 border !border-slate-200 dark:!border-slate-700 !text-slate-700 dark:!text-white"
            @click="openAddDialog"
          >
            <Plus :size="16" />
            <span class="hidden sm:block">Add Movie</span>
          </RouterLink>

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
        class="p-datatable-gridlines !rounded-xl !flex-grow min-h-0"
        scrollable
        scroll-height="flex"
      >
        <Column field="id" header="ID" style="width: 90px" sortable class="w-24" />
        <Column field="title" header="Title" sortable class="w-2xs">
          <template #body="{ data }">
            <div class="w-full flex gap-x-3">
              <RouterLink :to="`/movies/${data.id}`" class="underline">{{ data.title }}</RouterLink>
            </div>
          </template>
        </Column>
        <Column field="description" header="Description" sortable class="w-2xs" />
        <Column field="created_at" header="Created At" sortable class="w-2xs" />
        <Column field="updated_at" header="Last Updated At" sortable class="w-2xs" />

        <!-- Actions -->
        <Column
          header="Actions"
          headerStyle="width:160px; text-align:center"
          bodyStyle="text-align:center"
        >
          <template #body="{ data }">
            <div class="w-full flex gap-x-3">
              <!-- <Button
                icon="pi pi-pencil"
                class="p-button-text p-button-sm"
                @click="openEditDialog(data)"
                title="Edit"
              /> -->
              <RouterLink
                :to="`/movies/${data.id}/edit`"
                class="p-button p-button-text p-button-sm"
              >
                <Pencil :size="16" />
              </RouterLink>
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

    <!-- Confirm Delete -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMoviesStore } from '@/stores/moviesStore'

import { RouterLink } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import toastHandler from '@/composables/toastHandeler'
import { Download, Pencil, Plus } from 'lucide-vue-next'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import type { Movie } from '@/types/movies'

const moviesStore = useMoviesStore()
// const mainStore = useMainStore()
// const router = useRouter()
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
// onMounted(() => {
//   if (mainStore.backend.url?.trim() !== '') {
//     if (movies.value.length < 1) moviesStore.fetchMovies()
//   } else {
//     showToast('warn', 'Warning', 'No backend selected. Navigating to home page.')
//     router.push('/settings')
//   }
// })

// onMounted(() => {
//   const checkInterval = setInterval(async () => {
//     const isAlive = await mainStore.checkBackendHealth(mainStore.backend.url)
//     if (!isAlive) {
//       showToast('error', 'Disconnected', 'Backend went offline. Redirecting home...')
//       router.push('/')
//     }
//   }, 10000) // check every 10s

//   onUnmounted(() => clearInterval(checkInterval))
// })

// Dialog state
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const movieForm = ref<Partial<Movie>>({ title: '', description: '' })
// let editingMovieId: string | null = null

// Open dialogs
function openAddDialog() {
  dialogMode.value = 'add'
  movieForm.value = { title: '', description: '' }
  dialogVisible.value = true
}

// function openEditDialog(movie: Movie) {
//   dialogMode.value = 'edit'
//   editingMovieId = movie.id
//   movieForm.value = { title: movie.title, description: movie.description }
//   dialogVisible.value = true
// }

// Save or update
// async function saveMovie() {
//   if (!movieForm.value.title?.trim()) {
//     showToast('warn', 'Validation', 'Title is required.')
//     return
//   }

//   try {
//     if (dialogMode.value === 'add') {
//       await moviesStore.addMovie({
//         title: movieForm.value.title,
//         description: movieForm.value.description,
//       })
//       showToast('success', 'Success', 'Movie added successfully.')
//     } else if (editingMovieId) {
//       await moviesStore.updateMovie(editingMovieId, {
//         title: movieForm.value.title,
//         description: movieForm.value.description,
//       })
//       showToast('success', 'Success', 'Movie updated successfully.')
//     }
//     dialogVisible.value = false
//   } catch (err) {
//     console.error(err)
//     showToast('error', 'Error', 'Failed to save movie.')
//   }
// }

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
      await moviesStore.deleteMovie(parseInt(id))
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
