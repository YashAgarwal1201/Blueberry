import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PersonFormPage from '../PersonFormPage.vue'
import { usePeopleStore } from '@/stores/peopleStore'
import apiClient from '@/services/apiInterceptors'

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

vi.mock('@/services/apiInterceptors', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    }
  }
})

describe('PersonFormPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.params = {}
  })

  it('renders correctly for Add Person', async () => {
    const wrapper = mount(PersonFormPage)
    
    expect(wrapper.text()).toContain('Add Person')
    expect(wrapper.text()).toContain('Add a new cast or crew member.')
    
    const nameInput = wrapper.find('input[type="text"]')
    expect(nameInput.exists()).toBe(true)
  })

  it('renders correctly for Edit Person', async () => {
    mockRoute.params = { id: '1' }
    
    ;(apiClient.get as any).mockResolvedValue({
      data: {
        person: {
          id: 1,
          name: 'Existing Person',
          also_known_as: '',
          bio: '',
          birth_date: '',
          birth_place: '',
          profile_url: '',
          imdb_id: ''
        }
      }
    })

    const wrapper = mount(PersonFormPage)
    
    // Wait for loadData
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Edit Person')
    
    const nameInput = wrapper.find('input[type="text"]').element as HTMLInputElement
    expect(nameInput.value).toBe('Existing Person')
  })

  it('validates name before submit', async () => {
    const peopleStore = usePeopleStore()
    peopleStore.createPerson = vi.fn()
    
    const wrapper = mount(PersonFormPage)
    
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.text()).toContain('Name is required')
    expect(peopleStore.createPerson).not.toHaveBeenCalled()
  })

  it('submits correctly to add person', async () => {
    const peopleStore = usePeopleStore()
    peopleStore.createPerson = vi.fn().mockResolvedValue({ id: 1, name: 'New Person' })

    const wrapper = mount(PersonFormPage)
    
    const nameInput = wrapper.find('input[placeholder="Full name"]')
    await nameInput.setValue('New Person')
    
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(peopleStore.createPerson).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Person' }))
    expect(mockRouter.push).toHaveBeenCalledWith('/people')
  })
})
