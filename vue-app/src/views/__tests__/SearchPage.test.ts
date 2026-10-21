import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchPage from '../SearchPage.vue'
import { useSearchStore } from '@/stores/searchStore'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useRoute: () => ({ query: {} }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn(),
  }),
}))

vi.mock('@/services/db', () => ({
  db: {
    recentSearches: {
      orderBy: () => ({ reverse: () => ({ toArray: vi.fn().mockResolvedValue([]) }) }),
      where: () => ({ equals: () => ({ first: vi.fn().mockResolvedValue(null) }) }),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ value: { isPending: false, data: null } }),
  },
}))

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
  },
}))

vi.mock('@/composables/toastHandler', () => ({
  default: () => ({
    showToast: vi.fn(),
  }),
}))

describe('SearchPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders initial search header and input', () => {
    const wrapper = mount(SearchPage, {
      global: {
        stubs: {
          MediaDrawer: true,
          PersonProfileDrawer: true,
          SearchResultRow: true,
          SearchEmptyState: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Search')
    expect(wrapper.find('input[type="search"]').exists()).toBe(true)
  })

  it('renders tabs and search results when query is entered and results exist', async () => {
    const searchStore = useSearchStore()
    searchStore.movieResults = [
      { id: 1, uuid: 'm1', title: 'Inception', release_year: 2010 } as any,
    ]
    searchStore.showResults = []
    searchStore.peopleResults = []

    const wrapper = mount(SearchPage, {
      global: {
        stubs: {
          MediaDrawer: true,
          PersonProfileDrawer: true,
          SearchResultRow: {
            props: ['item'],
            template: '<div class="search-result-stub">{{ item?.title || item?.name }}</div>',
          },
          SearchEmptyState: true,
        },
      },
    })

    const input = wrapper.find('input[type="search"]')
    await input.setValue('Inception')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('All')
    expect(wrapper.text()).toContain('Movies')
    expect(wrapper.text()).toContain('Inception')
  })

  it('switches tabs on click', async () => {
    const searchStore = useSearchStore()
    searchStore.movieResults = [
      { id: 1, uuid: 'm1', title: 'Inception', release_year: 2010 } as any,
    ]
    searchStore.peopleResults = [
      { id: 2, name: 'Leonardo DiCaprio' } as any,
    ]

    const wrapper = mount(SearchPage, {
      global: {
        stubs: {
          MediaDrawer: true,
          PersonProfileDrawer: true,
          SearchResultRow: true,
          SearchEmptyState: true,
        },
      },
    })

    const input = wrapper.find('input[type="search"]')
    await input.setValue('Leo')
    await wrapper.vm.$nextTick()

    // Click on People tab
    const peopleTab = wrapper.findAll('button').find(b => b.text().includes('People'))
    expect(peopleTab).toBeDefined()
    if (peopleTab) {
      await peopleTab.trigger('click')
      expect(searchStore.activeTab).toBe('people')
    }
  })
})
