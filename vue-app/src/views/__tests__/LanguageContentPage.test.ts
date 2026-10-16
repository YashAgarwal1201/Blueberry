import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanguageContentPage from '../LanguageContentPage.vue'
import { useLanguagesStore } from '@/stores/languagesStore'

const mockRoute = { params: { code: 'en' }, name: 'language-content' }
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

vi.mock('@/services/apiInterceptors', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    },
    getBackendStatus: vi.fn().mockReturnValue(true)
  }
})

describe('LanguageContentPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.params.code = 'en'
  })

  it('renders loading skeleton state', () => {
    const languagesStore = useLanguagesStore()
    languagesStore.sectionsLoadingMap.set('en', true)

    const wrapper = mount(LanguageContentPage, {
      global: {
        stubs: { GoBackButton: true, MediaCard: true }
      }
    })

    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders empty state when no movies', async () => {
    const languagesStore = useLanguagesStore()
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    languagesStore.fetchLanguageSections = vi.fn().mockResolvedValue({})
    languagesStore.languages = [{ id: 1, name: 'English', code: 'en', native_script: 'English' }] as any
    languagesStore.sectionsByLanguage.set('en', [])
    languagesStore.sectionsLoadingMap.set('en', false)

    const wrapper = mount(LanguageContentPage, {
      global: {
        stubs: { GoBackButton: true, MediaCard: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('English')
    expect(wrapper.text()).toContain('No movies in this language yet.')
  })

  it('renders movies when data is available', async () => {
    const languagesStore = useLanguagesStore()
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    languagesStore.fetchLanguageSections = vi.fn().mockResolvedValue({})
    
    languagesStore.languages = [
      { id: 1, name: 'English', code: 'en' }
    ] as any
    languagesStore.sectionsByLanguage.set('en', [
      {
        genre: { id: 1, name: 'Action', slug: 'action' },
        movies: [{ id: 101, title: 'English Movie 1', release_year: 2020 }] as any
      }
    ])
    languagesStore.sectionsLoadingMap.set('en', false)

    const wrapper = mount(LanguageContentPage, {
      global: {
        stubs: { GoBackButton: true, MediaCarousel: false, MediaCard: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('English')
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.findComponent({ name: 'MediaCard' }).exists() || wrapper.find('media-card-stub').exists()).toBe(true)
  })
})
