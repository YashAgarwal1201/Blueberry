// stores/languagesStore.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
// import { useMainStore } from './mainStore'
import apiClient from '@/services/apiInterceptors'
import type { Language } from '@/types/movies'

export const useLanguagesStore = defineStore('languagesStore', () => {
  // const mainStore = useMainStore()

  const languages = ref<Language[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const languageMap = computed(() => {
    const map = new Map<number, Language>()
    languages.value.forEach((lang) => map.set(lang.id, lang))
    return map
  })

  const languageByCode = computed(() => {
    const map = new Map<string, Language>()
    languages.value.forEach((lang) => map.set(lang.code, lang))
    return map
  })

  const getLanguageName = (id: number): string => {
    return languageMap.value.get(id)?.name || 'Unknown'
  }

  const fetchLanguages = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/languages')
      const data = response.data
      languages.value = data.languages || []
      return data.languages
    } catch (err: any) {
      console.error('Error fetching languages:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addLanguage = async (name: string, code: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/languages', { name, code })
      const data = response.data
      languages.value.push(data.language)
      return data.language
    } catch (err: any) {
      console.error('Error adding language:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    languages,
    loading,
    error,
    languageMap,
    languageByCode,
    getLanguageName,
    fetchLanguages,
    addLanguage,
  }
})
