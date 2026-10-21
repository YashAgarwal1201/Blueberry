import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '../index'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { ref } from 'vue'
import type { User } from 'shared-types'

const mockSession = ref<{ isPending: boolean; data: { user: User } | null }>({
  isPending: false,
  data: null,
})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => mockSession,
  },
}))

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, preferences: {} } }),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}))

describe('Router Navigation Guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockSession.value = { isPending: false, data: null }
  })

  it('redirects to Login when accessing requiresAuth route while unauthenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = false

    await router.push('/watchlist')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('allows access to requiresAuth route when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    await router.push('/watchlist')
    expect(router.currentRoute.value.name).toBe('Watchlist')
  })

  it('allows public access to /profile route even when unauthenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = false

    await router.push('/profile')
    expect(router.currentRoute.value.name).toBe('Profile')
  })

  it('waits for auth to hydrate on page reload before allowing access to requiresAuth route', async () => {
    // Start in loading state as happens on page reload
    mockSession.value = { isPending: true, data: null }
    const authStore = useAuthStore()
    expect(authStore.isAuthLoading).toBe(true)

    // Simulate session resolving asynchronously after 50ms
    setTimeout(() => {
      mockSession.value = {
        isPending: false,
        data: { user: { id: 'u1', role: 'user', name: 'User', email: 'u@example.com' } as User },
      }
    }, 50)

    await router.push('/watchlist')
    expect(router.currentRoute.value.name).toBe('Watchlist')
  })

  it('redirects to Home when non-admin accesses requiresAdmin route', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.user = { id: 'u1', role: 'user', name: 'User' } as User

    await router.push('/settings/users')
    expect(router.currentRoute.value.name).toBe('Home')
  })

  it('allows admin to access requiresAdmin route', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.user = { id: 'u1', role: 'admin', name: 'Admin' } as User

    await router.push('/settings/users')
    expect(router.currentRoute.value.name).toBe('settings-users')
  })

  it('redirects authenticated user from Login/Register to Home', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('Home')

    await router.push('/register')
    expect(router.currentRoute.value.name).toBe('Home')
  })

  it('redirects from /movies when showMovies preference is false', async () => {
    const prefs = usePreferencesStore()
    prefs.showMovies = false

    await router.push('/movies')
    expect(router.currentRoute.value.name).toBe('Home')
  })

  it('redirects from /shows when showShows preference is false', async () => {
    const prefs = usePreferencesStore()
    prefs.showShows = false

    await router.push('/shows')
    expect(router.currentRoute.value.name).toBe('Home')
  })

  it('redirects from /people when showPeople preference is false', async () => {
    const prefs = usePreferencesStore()
    prefs.showPeople = false

    await router.push('/people')
    expect(router.currentRoute.value.name).toBe('Home')
  })
})

