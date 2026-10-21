import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserAddedMovies from '../UserAddedMovies.vue'
import { useMoviesStore } from '@/stores/moviesStore'
import { useAuthStore } from '@/stores/authStore'
import type { MovieWithDetails, User } from 'shared-types'

const mockRequire = vi.fn()
vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: mockRequire,
  }),
}))

interface UserAddedMoviesVM {
  confirmDelete: (uuid: string) => void
  downloadMovies: () => void
}

describe('UserAddedMovies.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders search input, buttons, and datatable', () => {
    const moviesStore = useMoviesStore()
    moviesStore.movies = [
      { id: 1, uuid: 'm1', title: 'Test Movie', description: 'Test Desc' } as unknown as MovieWithDetails,
    ]

    const wrapper = mount(UserAddedMovies, {
      global: {
        stubs: {
          DataTable: {
            props: ['value'],
            template: '<div class="datatable-stub"><slot /></div>',
          },
          Column: true,
          InputText: true,
          Button: { template: '<button><slot /></button>' },
          ConfirmDialog: true,
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    expect(wrapper.find('.datatable-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Add Movie')
    expect(wrapper.text()).toContain('Download Data')
  })

  it('triggers delete confirmation dialog on confirmDelete call', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u1', role: 'moderator' } as unknown as User

    const wrapper = mount(UserAddedMovies, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          InputText: true,
          Button: true,
          ConfirmDialog: true,
          RouterLink: true,
        },
      },
    })

    const vm = wrapper.vm as unknown as UserAddedMoviesVM
    vm.confirmDelete('m1')
    expect(mockRequire).toHaveBeenCalled()
    expect(mockRequire.mock.calls[0]?.[0]?.message).toContain('Are you sure you want to delete this movie?')
  })

  it('handles downloadMovies export', () => {
    const moviesStore = useMoviesStore()
    moviesStore.movies = [{ id: 1, uuid: 'm1', title: 'Movie 1' } as unknown as MovieWithDetails]

    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectURLMock = vi.fn()
    globalThis.URL.createObjectURL = createObjectURLMock
    globalThis.URL.revokeObjectURL = revokeObjectURLMock

    const wrapper = mount(UserAddedMovies, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          InputText: true,
          Button: true,
          ConfirmDialog: true,
          RouterLink: true,
        },
      },
    })

    const vm = wrapper.vm as unknown as UserAddedMoviesVM
    vm.downloadMovies()
    expect(createObjectURLMock).toHaveBeenCalled()
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url')
  })
})
