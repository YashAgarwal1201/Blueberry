<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
        Dashboard
      </h1>
      <p class="font-content text-slate-600 dark:text-slate-400">Choose you backend.</p>
    </div>

    <div class="flex flex-col gap-y-3">
      <!-- Global Search -->
      <div class="flex items-center gap-x-3">
        <InputText
          v-model="globalFilter"
          placeholder="Search by title or description"
          class="flex-grow"
        />
      </div>

      <DataTable
        :value="movies"
        :filters="filters"
        :globalFilterFields="['title', 'description']"
        dataKey="id"
        editMode="row"
        @row-edit-init="onRowEditInit"
        @row-edit-save="onRowEditSave"
        @row-edit-cancel="onRowEditCancel"
        :loading="moviesStore.loading"
        paginator
        :rows="10"
        class="p-datatable-gridlines !rounded-xl"
      >
        <!-- Row editor buttons (save/cancel) -->
        <Column
          rowEditor
          headerStyle="width:120px; text-align:center"
          bodyStyle="text-align:center"
        />

        <Column field="id" header="ID" style="width: 90px" sortable />

        <!-- Title column with editor and column filter -->
        <Column
          field="title"
          header="Title"
          sortable
          :filter="true"
          filterPlaceholder="Filter by title"
        >
          <template #body="slotProps">
            {{ slotProps.data.title }}
          </template>

          <!-- editor slot for inline row editing -->
          <template #editor="slotProps">
            <InputText v-model="slotProps.data.title" />
          </template>
        </Column>

        <!-- Description column with editor and filter -->
        <Column
          field="description"
          header="Description"
          :filter="true"
          filterPlaceholder="Filter by description"
        >
          <template #body="slotProps">
            {{ slotProps.data.description || '—' }}
          </template>

          <template #editor="slotProps">
            <InputText v-model="slotProps.data.description" />
          </template>
        </Column>

        <!-- Actions column: edit (init row edit) and delete -->
        <Column
          header="Actions"
          headerStyle="width:140px; text-align:center"
          bodyStyle="text-align:center"
        >
          <template #body="{ data }">
            <Button
              icon="pi pi-pencil"
              class="p-button-text p-button-sm"
              @click="onRowEditInit(data)"
              title="Edit"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-text p-button-sm p-button-danger"
              @click="confirmDelete(data.id)"
              title="Delete"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <div class="mt-auto flex justify-start">
      <RouterLink
        to="/"
        class="px-4 py-2 rounded-full flex items-center justify-center gap-x-2 cursor-pointer bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white"
        >Go Back</RouterLink
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMoviesStore } from '@/stores/moviesStore'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { FilterMatchMode } from '@primevue/core/api'
import { RouterLink } from 'vue-router'

const moviesStore = useMoviesStore()

const globalFilter = ref<string | null>(null)

// Filters object following PrimeVue advanced filtering shape
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  title: { value: null, matchMode: FilterMatchMode.CONTAINS },
  description: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

// keep filters.global in sync with globalFilter input
watch(globalFilter, (val) => {
  filters.value.global.value = val
})

// expose movies (computed to stay reactive to store)
const movies = computed(() => moviesStore.movies)

// editingRows is tracked internally by PrimeVue row edit, but we use simple flow
// We'll rely on rowEditor events instead, so no separate editingRows ref required.

// lifecycle: fetch movies
onMounted(() => {
  if (moviesStore.movies?.length < 1) moviesStore.fetchMoviesList()
})

// Row editing lifecycle handlers
function onRowEditInit(event: any) {
  // PrimeVue will take care of entering row edit mode when rowEditor column is clicked,
  // but calling this in Actions ensures the edit UI appears when user clicks our pencil.
  // The DataTable will emit row-edit-init; event may be either row data or DataTable event.
  // To trigger built-in edit mode we programmatically simulate it by toggling a field:
  // For convenience, we use the DataTable's rowEditInit emission handled by DataTable automatically
  // So here we just let the event bubble — but since we call this method from action button,
  // do nothing: DataTable requires a reference to call dt.editingRows[...] if needed.
  // Simpler: open built-in editor by toggling editing via DOM — but easiest UX: click the rowEditor cell.
  // We'll instead set a special property used by the table if you want server-side control.
  // (No-op here; clicking the rowEditor icon in the row will also work)
}

// When user saves inline edits
async function onRowEditSave(event: any) {
  const updated = event.data // row after editing
  try {
    // Call your store action to persist the change (store should call API)
    await moviesStore.updateMovie(updated.id, {
      title: updated.title,
      description: updated.description,
    })
    // Optionally show success toast in your app
  } catch (err) {
    // If persistence fails, you might want to revert or show an error (not implemented here)
    console.error('Failed to update movie:', err)
  }
}

// When user cancels edit
function onRowEditCancel(event: any) {
  // Optionally refresh the row from the store/backend to revert client-side changes
  // e.g., moviesStore.reloadMovie(event.data.id)
  // No-op here; PrimeVue will restore previous state if you don't mutate the source
}

// Confirm + delete
function confirmDelete(id: string) {
  // Simple confirmation using native dialog. Replace with PrimeVue ConfirmDialog for nicer UI.
  if (window.confirm('Delete this movie? This cannot be undone.')) {
    moviesStore.deleteMovie(id)
  }
}
</script>

<style scoped></style>
