import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../authStore'
import { ref, nextTick } from 'vue'

// Mock the authClient
const mockSession = ref({ isPending: true, data: null })

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => mockSession
  }
}))

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset the mock state
    mockSession.value = { isPending: true, data: null }
  })

  it('initializes with loading state and false authentication', () => {
    const store = useAuthStore()
    expect(store.isAuthLoading).toBe(true)
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAdmin).toBe(false)
  })

  it('updates state when session data is loaded', async () => {
    const store = useAuthStore()
    
    // Simulate loading finished with data
    mockSession.value = { 
      isPending: false, 
      data: { user: { name: 'Test User', role: 'user' } } as any
    }

    await nextTick()

    // Vue reactivity handles the update via watchEffect
    expect(store.isAuthLoading).toBe(false)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual({ name: 'Test User', role: 'user' })
    expect(store.isAdmin).toBe(false)
  })

  it('computes isAdmin correctly', async () => {
    const store = useAuthStore()
    
    mockSession.value = { 
      isPending: false, 
      data: { user: { name: 'Admin', role: 'admin' } } as any
    }

    await nextTick()

    expect(store.isAdmin).toBe(true)
  })

  it('handles null session correctly (not logged in)', async () => {
    const store = useAuthStore()
    
    mockSession.value = { 
      isPending: false, 
      data: null
    }

    await nextTick()

    expect(store.isAuthLoading).toBe(false)
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAdmin).toBe(false)
  })
})
