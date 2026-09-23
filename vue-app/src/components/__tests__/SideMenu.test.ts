import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SideMenu from '../SideMenu.vue'
import { useMainStore } from '@/stores/mainStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

const mockUpdateTheme = vi.fn()
vi.mock('@/composables/theme', () => ({
  useTheme: () => ({
    theme: 'system',
    updateTheme: mockUpdateTheme
  })
}))

const mockShowToast = vi.fn()
vi.mock('@/composables/toastHandeler', () => ({
  default: () => ({
    showToast: mockShowToast
  })
}))

// Mock PrimeVue components
const DrawerStub = {
  name: 'Drawer',
  props: ['visible'],
  template: '<div class="p-drawer" v-if="visible"><slot name="header"></slot><slot></slot></div>'
}
const SelectStub = {
  name: 'Select',
  props: ['modelValue', 'options'],
  template: '<select @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :value="opt.value">{{opt.label}}</option></select>'
}

describe('SideMenu.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders menu when showSideMenu is true', () => {
    const mainStore = useMainStore()
    mainStore.showSideMenu = true
    const preferencesStore = usePreferencesStore()
    preferencesStore.showMovies = true
    preferencesStore.showPeople = true

    const wrapper = mount(SideMenu, {
      global: {
        stubs: {
          Drawer: DrawerStub,
          Select: SelectStub,
          Palette: true,
          List: true,
          Blocks: true,
          Languages: true,
          UserSquare: true,
          Wrench: true,
          UserCircle: true,
          RouterLink: RouterLinkStub
        }
      }
    })

    expect(wrapper.find('.p-drawer').exists()).toBe(true)
    
    const links = wrapper.findAllComponents(RouterLinkStub)
    const hrefs = links.map(a => a.props('to'))
    
    expect(hrefs).toContain('/watchlist')
    expect(hrefs).toContain('/movies')
    expect(hrefs).toContain('/languages')
    expect(hrefs).toContain('/genres')
    expect(hrefs).toContain('/people')
    expect(hrefs).toContain('/settings')
  })

  it('hides movies and people links based on preferences', () => {
    const mainStore = useMainStore()
    mainStore.showSideMenu = true
    const preferencesStore = usePreferencesStore()
    preferencesStore.showMovies = false
    preferencesStore.showPeople = false

    const wrapper = mount(SideMenu, {
      global: {
        stubs: {
          Drawer: DrawerStub,
          Select: SelectStub,
          Palette: true,
          List: true,
          Blocks: true,
          Languages: true,
          UserSquare: true,
          Wrench: true,
          UserCircle: true,
          RouterLink: RouterLinkStub
        }
      }
    })

    const links = wrapper.findAllComponents(RouterLinkStub)
    const hrefs = links.map(a => a.props('to'))
    
    expect(hrefs).not.toContain('/movies')
    expect(hrefs).not.toContain('/people')
    expect(hrefs).toContain('/watchlist')
  })

  it('calls updateTheme and showToast on theme change', async () => {
    const mainStore = useMainStore()
    mainStore.showSideMenu = true

    const wrapper = mount(SideMenu, {
      global: {
        stubs: {
          Drawer: DrawerStub,
          Select: SelectStub,
          Palette: true,
          List: true,
          Blocks: true,
          Languages: true,
          UserSquare: true,
          Wrench: true,
          UserCircle: true,
          RouterLink: RouterLinkStub
        }
      }
    })

    const select = wrapper.find('select')
    select.element.value = 'dark'
    await select.trigger('change')

    expect(mockUpdateTheme).toHaveBeenCalledWith('dark')
    expect(mockShowToast).toHaveBeenCalledWith('info', 'Theme Changed', 'Switched to dark mode')
  })
})
