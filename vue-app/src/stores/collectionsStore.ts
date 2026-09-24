import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { Collection, CollectionDetail, CreateCollectionRequest, UpdateCollectionRequest } from 'shared-types'
import { getErrorMessage } from '@/services/errorUtils'

export const useCollectionsStore = defineStore('collectionsStore', () => {
  const myCollections = ref<Collection[]>([])
  const currentCollection = ref<CollectionDetail | null>(null)
  const communityCollections = ref<Collection[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMyCollections = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/collections')
      myCollections.value = response.data.data || []
      return myCollections.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching your collections')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCommunityCollections = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/collections?community=true')
      communityCollections.value = response.data.data || []
      return communityCollections.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching community collections')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCollectionDetail = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/collections/${id}`)
      currentCollection.value = response.data.data
      return currentCollection.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching collection details')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCollection = async (payload: CreateCollectionRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/collections', payload)
      const newCollection = response.data.data
      myCollections.value.unshift(newCollection)
      return newCollection
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error creating collection')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCollection = async (id: number, payload: UpdateCollectionRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put(`/collections/${id}`, payload)
      const updated = response.data.data
      // Update lists
      const idx = myCollections.value.findIndex(c => c.id === id)
      if (idx !== -1) myCollections.value[idx] = updated
      // Update current detail if active
      if (currentCollection.value?.id === id) {
        currentCollection.value = { ...currentCollection.value, ...updated }
      }
      return updated
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error updating collection')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCollection = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/collections/${id}`)
      myCollections.value = myCollections.value.filter(c => c.id !== id)
      if (currentCollection.value?.id === id) {
        currentCollection.value = null
      }
      return true
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error deleting collection')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addItemToCollection = async (collectionId: number, mediaId: number, type: 'movie' | 'tv') => {
    loading.value = true
    error.value = null
    try {
      const payload = type === 'movie' ? { movie_id: mediaId } : { show_id: mediaId }
      const response = await apiClient.post(`/collections/${collectionId}/items`, payload)
      
      const updatedDetail = response.data.data
      
      // Update item count in lists
      const idx = myCollections.value.findIndex(c => c.id === collectionId)
      if (idx !== -1) {
        const col = myCollections.value[idx]
        if (col) col.item_count = updatedDetail.item_count
      }
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = updatedDetail
      }

      return updatedDetail
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error adding item to collection')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeItemFromCollection = async (collectionId: number, mediaId: number, type: 'movie' | 'tv') => {
    loading.value = true
    error.value = null
    try {
      const qs = type === 'movie' ? `movie_id=${mediaId}` : `show_id=${mediaId}`
      const response = await apiClient.delete(`/collections/${collectionId}/items?${qs}`)
      
      const updatedDetail = response.data.data

      // Update item count in lists
      const idx = myCollections.value.findIndex(c => c.id === collectionId)
      if (idx !== -1) {
        const col = myCollections.value[idx]
        if (col && typeof col.item_count === 'number' && col.item_count > 0) {
          col.item_count--
        }
      }
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = updatedDetail
      }

      return updatedDetail
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error removing item from collection')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const reorderCollection = async (collectionId: number, items: { movie_id?: number, show_id?: number, display_order: number }[]) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put(`/collections/${collectionId}/reorder`, { items })
      const updatedDetail = response.data.data
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = updatedDetail
      }
      return updatedDetail
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error reordering collection')
      console.error(message, err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    myCollections,
    communityCollections,
    currentCollection,
    loading,
    error,
    fetchMyCollections,
    fetchCommunityCollections,
    fetchCollectionDetail,
    createCollection,
    updateCollection,
    deleteCollection,
    addItemToCollection,
    removeItemFromCollection,
    reorderCollection
  }
})
