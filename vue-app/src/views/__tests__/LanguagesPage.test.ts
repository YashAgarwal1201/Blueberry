import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanguagesPage from '../LanguagesPage.vue'
import { useLanguagesStore } from '@/stores/languagesStore'

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

vi.mock('@/composables/toastHandeler', () => ({
  default: () => ({
    showToast: vi.fn()
  })
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

describe('LanguagesPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders skeletons when loading', () => {
    const languagesStore = useLanguagesStore()
    languagesStore.loading = true

    const wrapper = mount(LanguagesPage, {
      global: {
        stubs: { GoBackButton: true }
      }
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('renders empty state when no languages have movies', async () => {
    const languagesStore = useLanguagesStore()
    languagesStore.loading = false
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    languagesStore.fetchMoviesByLanguage = vi.fn().mockResolvedValue({})
    
    languagesStore.languages = [
      { id: 1, name: 'English', code: 'en' }
    ] as any
    // moviesByLanguage is a map
    languagesStore.moviesByLanguage.set('en', [])
    languagesStore.moviesLoadingMap.set('en', false)

    const wrapper = mount(LanguagesPage, {
      global: {
        stubs: { GoBackButton: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('No movies added yet.')
  })

  it('renders languages with movies', async () => {
    const languagesStore = useLanguagesStore()
    languagesStore.loading = false
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    languagesStore.fetchMoviesByLanguage = vi.fn().mockResolvedValue({})
    
    languagesStore.languages = [
      { id: 1, name: 'English', code: 'en' }
    ] as any
    languagesStore.moviesByLanguage.set('en', [
      { id: 101, title: 'English Movie 1', release_year: 2020 } as any
    ])
    languagesStore.moviesLoadingMap.set('en', false)

    const wrapper = mount(LanguagesPage, {
      global: {
        stubs: { GoBackButton: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('English')
    expect(wrapper.text()).toContain('English Movie 1')
    expect(wrapper.text()).toContain('2020')
  })

  it('shows add dialog and calls addLanguage', async () => {
    const languagesStore = useLanguagesStore()
    languagesStore.loading = false
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    languagesStore.fetchMoviesByLanguage = vi.fn().mockResolvedValue({})
    languagesStore.addLanguage = vi.fn().mockResolvedValue({})
    
    const wrapper = mount(LanguagesPage, {
      global: {
        stubs: { GoBackButton: true }
      }
    })

    // Find and click + Add Language button
    const buttons = wrapper.findAll('button')
    const addBtn = buttons.find(b => b.text().includes('+ Add Language'))
    await addBtn?.trigger('click')

    expect(wrapper.text()).toContain('Add Language')
    
    // Fill in inputs
    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('French')
    await inputs[1]!.setValue('fr')
    
    // Submit
    const dialogButtons = wrapper.findAll('button')
    const submitBtn = dialogButtons.find(b => b.text() === 'Add')
    await submitBtn?.trigger('click')
    
    expect(languagesStore.addLanguage).toHaveBeenCalledWith('French', 'fr')
  })
})
