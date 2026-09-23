import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePreferencesStore } from '../preferencesStore'
import { useAuthStore } from '../authStore'
import apiClient from '@/services/apiInterceptors'
import { nextTick } from 'vue'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn()
  }
}))

vi.mock('../authStore', () => ({
  useAuthStore: vi.fn()
}))

describe('preferencesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: true } as any)
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, preferences: {} } })
  })

  it('initializes with default values', () => {
    const store = usePreferencesStore()
    expect(store.showMovies).toBe(true)
    expect(store.blockedGenres).toEqual([])
  })

  it('fetches preferences when authenticated', async () => {
    const store = usePreferencesStore()
    
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        preferences: {
          showMovies: false,
          blockedGenres: ['horror']
        }
      }
    })

    await store.fetchPreferences()
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/preferences')
    expect(store.showMovies).toBe(false)
    expect(store.blockedGenres).toEqual(['horror'])
    expect(store.showShows).toBe(true) // Should keep default for missing fields
  })

  it('does not fetch when not authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false } as any)
    const store = usePreferencesStore()
    
    await store.fetchPreferences()
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('saves preferences successfully', async () => {
    const store = usePreferencesStore()
    store.showMovies = false
    
    vi.mocked(apiClient.put).mockResolvedValueOnce({})

    const success = await store.savePreferences()
    
    expect(success).toBe(true)
    expect(apiClient.put).toHaveBeenCalledWith('/api/preferences', expect.objectContaining({
      showMovies: false
    }))
  })

  it('blocks and unblocks a movie', async () => {
    const store = usePreferencesStore()
    vi.mocked(apiClient.put).mockResolvedValue({})
    
    // Wait for the implicit fetchPreferences from watchEffect to resolve so it doesn't overwrite our push
    await new Promise(resolve => setTimeout(resolve, 10))

    await store.blockMovie('uuid-123')
    expect(store.blockedMovies).toContain('uuid-123')
    
    await store.unblockMovie('uuid-123')
    expect(store.blockedMovies).not.toContain('uuid-123')
  })
})
