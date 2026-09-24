import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MovieFormPage from '../MovieFormPage.vue'
import { useMoviesStore } from '@/stores/moviesStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useGenresStore } from '@/stores/genresStore'

const mockRoute = { params: {} as any }
const mockRouter = { push: vi.fn(), back: vi.fn() }

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

vi.mock('@/composables/toastHandeler', () => ({
  default: () => ({
    showToast: vi.fn()
  })
}))

describe('MovieFormPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.params = {}
  })

  it('renders correctly for Add Movie', async () => {
    const languagesStore = useLanguagesStore()
    const genresStore = useGenresStore()
    
    languagesStore.languages = [{ id: 1, name: 'English', code: 'en' }]
    genresStore.genres = [{ id: 1, name: 'Action', slug: 'action', created_at: '2023-01-01' }]
    
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    genresStore.fetchGenres = vi.fn().mockResolvedValue({})

    const wrapper = mount(MovieFormPage, {
      global: {
        stubs: { CastEditor: true }
      }
    })
    
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Add Movie')
    expect(wrapper.text()).toContain('Create a new movie with full details.')
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('renders correctly for Edit Movie', async () => {
    mockRoute.params = { uuid: '123-abc' }
    
    const languagesStore = useLanguagesStore()
    const genresStore = useGenresStore()
    const moviesStore = useMoviesStore()
    
    languagesStore.languages = [{ id: 1, name: 'English', code: 'en' }]
    genresStore.genres = [{ id: 1, name: 'Action', slug: 'action', created_at: '2023-01-01' }]
    
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    genresStore.fetchGenres = vi.fn().mockResolvedValue({})
    moviesStore.fetchMovieById = vi.fn().mockResolvedValue({
      id: 1,
      uuid: '123-abc',
      title: 'Existing Movie',
      languages: [],
      genres: [],
      cast: [],
      companies: []
    })

    const wrapper = mount(MovieFormPage, {
      global: {
        stubs: { CastEditor: true }
      }
    })
    
    // Wait for fetchMovieById
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Edit Movie')
    
    const titleInput = wrapper.find('input[type="text"]').element as HTMLInputElement
    expect(titleInput.value).toBe('Existing Movie')
  })

  it('submits correctly to add movie', async () => {
    const languagesStore = useLanguagesStore()
    const genresStore = useGenresStore()
    const moviesStore = useMoviesStore()
    
    languagesStore.languages = [{ id: 1, name: 'English', code: 'en' }]
    genresStore.genres = [{ id: 1, name: 'Action', slug: 'action', created_at: '2023-01-01' }]
    
    languagesStore.fetchLanguages = vi.fn().mockResolvedValue({})
    genresStore.fetchGenres = vi.fn().mockResolvedValue({})
    
    moviesStore.addMovie = vi.fn().mockResolvedValue({ uuid: 'new-uuid' })

    const wrapper = mount(MovieFormPage, {
      global: {
        stubs: { CastEditor: true }
      }
    })
    
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    
    const titleInput = wrapper.find('input[type="text"]')
    await titleInput.setValue('New Movie Title')
    
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(moviesStore.addMovie).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/movies/new-uuid')
  })
})
