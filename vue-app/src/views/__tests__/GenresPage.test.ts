import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GenresPage from '../GenresPage.vue'
import { useGenresStore } from '@/stores/genresStore'

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

describe('GenresPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders skeletons when loading', () => {
    const genresStore = useGenresStore()
    genresStore.loading = true

    const wrapper = mount(GenresPage, {
      global: {
        stubs: { GoBackButton: true }
      }
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('renders empty state when no genres have movies', async () => {
    const genresStore = useGenresStore()
    genresStore.loading = false
    genresStore.fetchGenres = vi.fn().mockResolvedValue({})
    genresStore.fetchMoviesByGenre = vi.fn().mockResolvedValue({})
    
    genresStore.genres = [
      { id: 1, name: 'Action', slug: 'action' }
    ] as any
    // visibleGenres is computed from genres
    genresStore.moviesByGenre.set('action', [])
    genresStore.moviesLoadingMap.set('action', false)

    const wrapper = mount(GenresPage, {
      global: {
        stubs: { GoBackButton: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('No movies added yet.')
  })

  it('renders genres with movies', async () => {
    const genresStore = useGenresStore()
    genresStore.loading = false
    genresStore.fetchGenres = vi.fn().mockResolvedValue({})
    genresStore.fetchMoviesByGenre = vi.fn().mockResolvedValue({})
    
    genresStore.genres = [
      { id: 1, name: 'Action', slug: 'action' }
    ] as any
    // visibleGenres is computed from genres
    genresStore.moviesByGenre.set('action', [
      { id: 101, title: 'Action Movie 1', release_year: 2020 } as any
    ])
    genresStore.moviesLoadingMap.set('action', false)

    const wrapper = mount(GenresPage, {
      global: {
        stubs: { GoBackButton: true }
      }
    })

    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Action Movie 1')
    expect(wrapper.text()).toContain('2020')
  })
})
