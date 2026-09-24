import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CollectionsList from '../CollectionsList.vue'
import { setActivePinia, createPinia } from 'pinia'
import { useCollectionsStore } from '@/stores/collectionsStore'

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [] } })),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

describe('CollectionsList.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with collections', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCollectionsStore()
    vi.spyOn(store, 'fetchMyCollections').mockResolvedValue(undefined as any)
    store.myCollections = [
      { id: 1, name: 'Sci-Fi Hits', item_count: 5, privacy: 'public' } as any
    ]
    
    const wrapper = mount(CollectionsList, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { template: '<a><slot></slot></a>' },
          Dialog: true,
          SaveToCollectionModal: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('Curate your own custom lists')
    expect(wrapper.text()).toContain('Sci-Fi Hits')
    expect(wrapper.text()).toContain('5 items')
  })

  it('renders empty state when no collections', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCollectionsStore()
    vi.spyOn(store, 'fetchMyCollections').mockResolvedValue(undefined as any)
    store.myCollections = []
    
    const wrapper = mount(CollectionsList, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { template: '<a><slot></slot></a>' },
          Dialog: true,
          SaveToCollectionModal: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('No collections yet')
  })
})
