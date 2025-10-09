import { ref } from 'vue'
import { defineStore } from 'pinia'

export type SelectedBackend = {
  title: string
  url: string
}

export const useMainStore = defineStore('mainStore', () => {
  const backend = ref<SelectedBackend>({
    title: '',
    url: '',
  })

  return { backend }
})
