<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
          Languages
        </h1>
        <p class="font-content text-slate-600 dark:text-slate-400">
          Manage available languages for movies
        </p>
      </div>

      <button
        @click="showAddDialog = true"
        class="px-4 py-2 rounded-lg bg-indigo-700 dark:bg-indigo-600 text-white flex items-center gap-2"
      >
        <span>+ Add Language</span>
      </button>
    </div>

    <div v-if="languagesStore.loading" class="text-slate-500">Loading languages...</div>
    <div v-else-if="languagesStore.languages.length === 0" class="text-slate-500">
      No languages available. Add some!
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="lang in languagesStore.languages"
        :key="lang.id"
        class="p-4 rounded-xl bg-blue-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      >
        <div class="font-semibold text-lg text-slate-900 dark:text-slate-100">{{ lang.name }}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Code: {{ lang.code }}</div>
      </div>
    </div>

    <!-- Add Language Dialog (Simple) -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showAddDialog = false"
    >
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl w-96">
        <h3 class="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Add Language</h3>

        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
              >Language Name</label
            >
            <input
              v-model="newLanguage.name"
              type="text"
              placeholder="e.g., English"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
              >Language Code</label
            >
            <input
              v-model="newLanguage.code"
              type="text"
              placeholder="e.g., en"
              maxlength="3"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
            <small class="text-slate-500">2-3 lowercase letters (ISO 639)</small>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="showAddDialog = false"
            class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button @click="addLanguage" class="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white">
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useMainStore } from '@/stores/mainStore'

const languagesStore = useLanguagesStore()
const mainStore = useMainStore()

const showAddDialog = ref(false)
const newLanguage = ref({ name: '', code: '' })

onMounted(async () => {
  if (mainStore.backend.url) {
    await languagesStore.fetchLanguages()
  }
})

async function addLanguage() {
  if (!newLanguage.value.name || !newLanguage.value.code) {
    alert('Please fill all fields')
    return
  }

  try {
    await languagesStore.addLanguage(newLanguage.value.name, newLanguage.value.code)
    showAddDialog.value = false
    newLanguage.value = { name: '', code: '' }
  } catch (err: any) {
    alert(err.message || 'Failed to add language')
  }
}
</script>
