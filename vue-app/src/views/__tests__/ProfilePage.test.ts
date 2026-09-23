import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProfilePage from '../ProfilePage.vue'
import { useAuthStore } from '@/stores/authStore'
import { useWatchlistStore } from '@/stores/watchListStore'

import { ref } from 'vue'

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush
  }),
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

const mockSignOut = vi.fn()
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: () => mockSignOut(),
    useSession: () => ref({ data: null, isPending: false })
  }
}))

vi.mock('@/services/apiInterceptors', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: { data: { items: [] } } }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    },
    getBackendStatus: vi.fn().mockReturnValue(true)
  }
})

describe('ProfilePage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows login prompt when not authenticated', () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = false

    const wrapper = mount(ProfilePage, {
      global: {
        stubs: { UserCircle: true, LogOut: true, Bookmark: true, CheckCircle: true, PlayCircle: true, MediaCard: true }
      }
    })

    expect(wrapper.text()).toContain('Not Logged In')
    expect(wrapper.text()).toContain('Sign In / Register')
  })

  it('shows profile data when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.user = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' } as any

    const wrapper = mount(ProfilePage, {
      global: {
        stubs: { UserCircle: true, LogOut: true, Bookmark: true, CheckCircle: true, PlayCircle: true, MediaCard: true }
      }
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('J') // Initials
  })

  it('switches watchlist tabs correctly', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.user = { id: '1', name: 'John Doe', email: 'john@example.com' } as any
    
    const watchlistStore = useWatchlistStore()
    // We can't directly mutate getters, but we can set items and let getters compute it
    watchlistStore.items = [
      { id: '1', status: 'want_to_watch', movie: { id: 101, title: 'Plan Movie', type: 'movie' } } as any,
      { id: '2', status: 'watching', movie: { id: 102, title: 'Watching Movie', type: 'movie' } } as any,
      { id: '3', status: 'watched', movie: { id: 103, title: 'Watched Movie', type: 'movie' } } as any
    ]

    const wrapper = mount(ProfilePage, {
      global: {
        stubs: { UserCircle: true, LogOut: true, Bookmark: true, CheckCircle: true, PlayCircle: true, MediaCard: true }
      }
    })

    // Should show want_to_watch items initially (we stubbed MediaCard, so we can't see the title in text directly if stubbed unless we check props, or we can just see that there's 1 item)
    expect(wrapper.findAllComponents('media-card-stub').length).toBe(1)
    
    const tabs = wrapper.findAll('button')
    // Find the watching tab
    const watchingTab = tabs.find(b => b.text().includes('Watching'))
    await watchingTab?.trigger('click')
    
    // Now should still show 1 item (watching)
    expect(wrapper.findAllComponents('media-card-stub').length).toBe(1)
  })

  it('handles sign out', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    const wrapper = mount(ProfilePage, {
      global: {
        stubs: { UserCircle: true, LogOut: true, Bookmark: true, CheckCircle: true, PlayCircle: true, MediaCard: true }
      }
    })

    const signOutBtn = wrapper.find('button', { text: 'Sign Out' })
    // In actual template, it is a button with "Sign Out"
    const buttons = wrapper.findAll('button')
    const btn = buttons.find(b => b.text().includes('Sign Out'))
    
    await btn?.trigger('click')
    
    expect(mockSignOut).toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })
})
