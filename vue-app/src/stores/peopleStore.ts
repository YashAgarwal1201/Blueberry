// vue-app/src/stores/peopleStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { Person, CreatePersonRequest } from '@/types/movies'
import { getErrorMessage } from '@/services/errorUtils'

export const usePeopleStore = defineStore('peopleStore', () => {
  const people = ref<Person[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const error = ref<string | null>(null)

  const fetchPeople = async (search?: string) => {
    loading.value = true
    error.value = null
    try {
      const params = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
      const response = await apiClient.get(`people${params}`)
      people.value = response.data.people || []
      return people.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching people')
      console.error('Error fetching people:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createPerson = async (data: CreatePersonRequest): Promise<Person> => {
    creating.value = true
    error.value = null
    try {
      const response = await apiClient.post('people', data)
      const newPerson: Person = response.data.person
      people.value.push(newPerson)
      return newPerson
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error creating person')
      console.error('Error creating person:', err)
      error.value = message
      throw err
    } finally {
      creating.value = false
    }
  }

  const searchPeople = async (query: string): Promise<Person[]> => {
    if (!query.trim()) return []
    try {
      const response = await apiClient.get(`people?search=${encodeURIComponent(query.trim())}`)
      return response.data.people || []
    } catch (err: unknown) {
      // const message = getErrorMessage(err, 'Error updating watchlist')
      console.error('Error searching people:', err)
      return []
    }
  }

  return {
    people,
    loading,
    creating,
    error,
    fetchPeople,
    createPerson,
    searchPeople,
  }
})
