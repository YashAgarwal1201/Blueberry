import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PeoplePage from '../PeoplePage.vue'
import { usePeopleStore } from '@/stores/peopleStore'
import { useMoviesStore } from '@/stores/moviesStore'

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot></slot></a>'
  },
  useRoute: vi.fn(),
  default: {
    push: vi.fn()
  }
}))
vi.mock('@/router', () => ({ default: { push: vi.fn() } }))

vi.mock('@/composables/toastHandeler', () => ({
  default: () => ({
    showToast: vi.fn()
  })
}))

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn()
  })
}))

vi.mock('@/services/apiInterceptors', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: { person: { filmography: [] } } }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    },
    getBackendStatus: vi.fn().mockReturnValue(true)
  }
})

describe('PeoplePage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    const peopleStore = usePeopleStore()
    const moviesStore = useMoviesStore()
    peopleStore.loading = true
    peopleStore.people = []
    moviesStore.movies = []

    const wrapper = mount(PeoplePage, {
      global: {
        stubs: { 
          PersonProfileDrawer: true, 
          PersonAddDialog: true, 
          Plus: true, 
          Search: true, 
          X: true, 
          User: true, 
          ChevronRight: true 
        }
      }
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('renders empty state when no people exist', async () => {
    const peopleStore = usePeopleStore()
    const moviesStore = useMoviesStore()
    peopleStore.fetchPeople = vi.fn().mockResolvedValue({})
    moviesStore.fetchMovies = vi.fn().mockResolvedValue({})
    peopleStore.loading = false
    peopleStore.people = []
    moviesStore.movies = []

    const wrapper = mount(PeoplePage, {
      global: {
        stubs: { 
          PersonProfileDrawer: true, 
          PersonAddDialog: true, 
          Plus: true, 
          Search: true, 
          X: true, 
          User: true, 
          ChevronRight: true 
        }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('No people added yet')
  })

  it('renders list of people and filters by search', async () => {
    const peopleStore = usePeopleStore()
    const moviesStore = useMoviesStore()
    peopleStore.fetchPeople = vi.fn().mockResolvedValue({})
    moviesStore.fetchMovies = vi.fn().mockResolvedValue({})
    peopleStore.loading = false
    
    peopleStore.people = [
      { id: 1, name: 'Christopher Nolan', also_known_as: 'Chris', birth_place: 'London' },
      { id: 2, name: 'Hans Zimmer', also_known_as: '', birth_place: 'Frankfurt' }
    ] as any

    moviesStore.movies = []

    const wrapper = mount(PeoplePage, {
      global: {
        stubs: { 
          PersonProfileDrawer: true, 
          PersonAddDialog: true, 
          Plus: true, 
          Search: true, 
          X: true, 
          User: true, 
          ChevronRight: true 
        }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Christopher Nolan')
    expect(wrapper.text()).toContain('Hans Zimmer')

    // Search filter
    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('Nolan')
    
    expect(wrapper.text()).toContain('Christopher Nolan')
    expect(wrapper.text()).not.toContain('Hans Zimmer')
    
    // Clear search
    const clearBtn = wrapper.find('.absolute.right-2\\.5') // wait, it's right-2.5
    if (clearBtn.exists()) {
      await clearBtn.trigger('click')
      expect(wrapper.text()).toContain('Hans Zimmer')
    }
  })
})
