import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CollectionDetailsPage from '../CollectionDetailsPage.vue'
import { setActivePinia, createPinia } from 'pinia'
import { useCollectionsStore } from '@/stores/collectionsStore'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [] } })),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: '1' }
  }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn()
  }),
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

describe('CollectionDetailsPage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCollectionsStore()
    vi.spyOn(store, 'fetchCollectionDetail').mockResolvedValue(undefined as any)
    store.currentCollection = null
    store.loading = true
    
    const wrapper = mount(CollectionDetailsPage, {
      global: {
        plugins: [pinia],
        stubs: { Dialog: true, TransitionGroup: true }
      }
    })
    
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('renders collection details and items', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    
    const authStore = useAuthStore()
    authStore.user = { id: 'user-1' } as any
    authStore.isAuthenticated = true
    
    const collectionsStore = useCollectionsStore()
    vi.spyOn(collectionsStore, 'fetchCollectionDetail').mockResolvedValue(undefined as any)
    collectionsStore.currentCollection = {
      id: 1,
      name: 'Action Hits',
      user_id: 'user-1',
      privacy: 'public',
      items: [
        { id: 101, type: 'movie', title: 'Die Hard' },
        { id: 102, type: 'movie', title: 'Terminator' }
      ]
    } as any
    collectionsStore.loading = false
    
    const wrapper = mount(CollectionDetailsPage, {
      global: {
        plugins: [pinia],
        stubs: { Dialog: true, TransitionGroup: true, RouterLink: true }
      }
    })
    
    expect(wrapper.text()).toContain('Action Hits')
    expect(wrapper.text()).toContain('public')
    expect(wrapper.text()).toContain('2 items')
    expect(wrapper.text()).toContain('Die Hard')
    expect(wrapper.text()).toContain('Terminator')
  })

  it('filters items based on search query', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const collectionsStore = useCollectionsStore()
    vi.spyOn(collectionsStore, 'fetchCollectionDetail').mockResolvedValue(undefined as any)
    collectionsStore.currentCollection = {
      id: 1,
      name: 'Action Hits',
      items: [
        { id: 101, type: 'movie', title: 'Die Hard' },
        { id: 102, type: 'movie', title: 'Terminator' }
      ]
    } as any
    
    const wrapper = mount(CollectionDetailsPage, {
      global: {
        plugins: [pinia],
        stubs: { Dialog: true, TransitionGroup: true, RouterLink: true }
      }
    })
    
    const input = wrapper.find('input[placeholder="Search in collection..."]')
    await input.setValue('Die')
    
    expect(wrapper.text()).toContain('Die Hard')
    expect(wrapper.text()).not.toContain('Terminator')
  })
})
