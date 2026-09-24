import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SaveToCollectionModal from '../SaveToCollectionModal.vue'
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

// Mock PrimeVue components and services
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

describe('SaveToCollectionModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no collections exist', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    
    const wrapper = mount(SaveToCollectionModal, {
      props: {
        visible: true,
        media: { id: 100, type: 'movie', title: 'Inception', poster_url: '' } as any
      },
      global: {
        plugins: [pinia],
        stubs: {
          Dialog: {
            template: '<div><slot></slot></div>'
          }
        }
      }
    })
    
    expect(wrapper.text()).toContain("You don't have any collections yet.")
  })

  it('renders list of collections', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCollectionsStore()
    store.myCollections = [
      { id: 1, name: 'Favs', item_count: 5 } as any,
      { id: 2, name: 'Watchlist', item_count: 2 } as any
    ]
    
    const wrapper = mount(SaveToCollectionModal, {
      props: {
        visible: true,
        media: { id: 100, type: 'movie', title: 'Inception', poster_url: '' } as any
      },
      global: {
        plugins: [pinia],
        stubs: {
          Dialog: {
            template: '<div><slot></slot></div>'
          }
        }
      }
    })
    
    expect(wrapper.text()).toContain('Favs')
    expect(wrapper.text()).toContain('5 items')
    expect(wrapper.text()).toContain('Watchlist')
    expect(wrapper.text()).toContain('2 items')
  })

  it('calls createCollection when form is submitted', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCollectionsStore()
    vi.spyOn(store, 'createCollection').mockResolvedValue({} as any)
    
    const wrapper = mount(SaveToCollectionModal, {
      props: {
        visible: true,
        media: { id: 100, type: 'movie', title: 'Inception', poster_url: '' } as any
      },
      global: {
        plugins: [pinia],
        stubs: {
          Dialog: { template: '<div><slot></slot></div>' }
        }
      }
    })
    
    const input = wrapper.find('input[type="text"]')
    await input.setValue('New Super Collection')
    
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    
    expect(store.createCollection).toHaveBeenCalledWith({ name: 'New Super Collection', slug: '', privacy: 'private' })
  })
})
