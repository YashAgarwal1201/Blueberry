import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../authStore'
import { ref, nextTick } from 'vue'
import type { User } from 'shared-types'

// Mock the authClient
const mockSession = ref<{ isPending: boolean; data: { user: User } | null }>({
  isPending: true,
  data: null,
})

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => mockSession,
  },
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
      data: { user: { id: '1', name: 'Test User', role: 'user', email: 'test@example.com' } as User },
    }

    await nextTick()

    // Vue reactivity handles the update via watchEffect
    expect(store.isAuthLoading).toBe(false)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual({ id: '1', name: 'Test User', role: 'user', email: 'test@example.com' })
    expect(store.isAdmin).toBe(false)
  })

  it('computes isAdmin correctly', async () => {
    const store = useAuthStore()

    mockSession.value = {
      isPending: false,
      data: { user: { id: '2', name: 'Admin', role: 'admin', email: 'admin@example.com' } as User },
    }

    await nextTick()

    expect(store.isAdmin).toBe(true)
  })

  it('handles null session correctly (not logged in)', async () => {
    const store = useAuthStore()

    mockSession.value = {
      isPending: false,
      data: null,
    }

    await nextTick()

    expect(store.isAuthLoading).toBe(false)
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAdmin).toBe(false)
  })

  it('resolves waitUntilReady immediately if not loading', async () => {
    mockSession.value = {
      isPending: false,
      data: null,
    }
    const store = useAuthStore()
    await expect(store.waitUntilReady()).resolves.toBeUndefined()
  })

  it('waits in waitUntilReady until session loads', async () => {
    const store = useAuthStore()
    expect(store.isAuthLoading).toBe(true)

    let resolved = false
    const waitPromise = store.waitUntilReady().then(() => {
      resolved = true
    })

    expect(resolved).toBe(false)

    mockSession.value = {
      isPending: false,
      data: { user: { id: '3', name: 'User', role: 'user', email: 'u@example.com' } as User },
    }

    await waitPromise
    expect(resolved).toBe(true)
    expect(store.isAuthenticated).toBe(true)
  })
})

