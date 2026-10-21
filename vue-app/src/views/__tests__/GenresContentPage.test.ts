import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GenresContentPage from '../GenresContentPage.vue'
import { useGenresStore } from '@/stores/genresStore'

const mockRoute = { params: { slug: 'action' }, name: 'genre-content' }
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

describe('GenresContentPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.params.slug = 'action'
  })

  it('renders loading skeleton state', () => {
    const genresStore = useGenresStore()
    genresStore.sectionsLoadingMap.set('action', true)

    const wrapper = mount(GenresContentPage, {
      global: {
        stubs: { GoBackButton: true, MediaCard: true }
      }
    })

    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders empty state when no movies', async () => {
    const genresStore = useGenresStore()
    genresStore.fetchGenres = vi.fn().mockResolvedValue({})
    genresStore.fetchGenreSections = vi.fn().mockResolvedValue({})
    genresStore.genres = [{ id: 1, name: 'Action', slug: 'action' }] as any
    genresStore.sectionsByGenre.set('action', [])
    genresStore.sectionsLoadingMap.set('action', false)

    const wrapper = mount(GenresContentPage, {
      global: {
        stubs: { GoBackButton: true, MediaCard: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('No movies in this genre yet.')
  })

  it('renders movies when data is available', async () => {
    const genresStore = useGenresStore()
    genresStore.fetchGenres = vi.fn().mockResolvedValue({})
    genresStore.fetchGenreSections = vi.fn().mockResolvedValue({})
    
    genresStore.genres = [
      { id: 1, name: 'Action', slug: 'action', description: 'Action movies' }
    ] as any
    genresStore.sectionsByGenre.set('action', [
      {
        language: { id: 1, code: 'en', name: 'English' },
        movies: [{ id: 101, title: 'Action Movie 1', release_year: 2020 }] as any
      }
    ])
    genresStore.sectionsLoadingMap.set('action', false)

    const wrapper = mount(GenresContentPage, {
      global: {
        stubs: { GoBackButton: true, MediaCarousel: false, MediaCard: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Action movies')
    expect(wrapper.text()).toContain('English')
    expect(wrapper.findComponent({ name: 'MediaCard' }).exists() || wrapper.find('media-card-stub').exists()).toBe(true)
  })
})
