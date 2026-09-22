import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMainStore = defineStore('mainStore', () => {
  const showSideMenu = ref<boolean>(false)

  const toggleSideMenu = () => {
    showSideMenu.value = !showSideMenu.value
  }

  return { showSideMenu, toggleSideMenu }
})
