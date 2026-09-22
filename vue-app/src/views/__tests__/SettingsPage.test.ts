import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsPage from '../SettingsPage.vue'
import { useAuthStore } from '@/stores/authStore'

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot></slot></a>'
  },
  RouterView: {
    template: '<div><slot></slot></div>'
  }
}))

describe('SettingsPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders standard nav items for regular user', () => {
    const authStore = useAuthStore()
    authStore.user = { id: '1', name: 'User', role: 'user' } as any

    const wrapper = mount(SettingsPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, RouterView: true }
      }
    })

    expect(wrapper.text()).toContain('App Preferences')
    expect(wrapper.text()).toContain('Blocked Titles')
    expect(wrapper.text()).not.toContain('Movies Added')
  })

  it('renders admin nav items for admin user', () => {
    const authStore = useAuthStore()
    authStore.user = { id: '1', name: 'Admin', role: 'admin' } as any

    const wrapper = mount(SettingsPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, RouterView: true }
      }
    })

    expect(wrapper.text()).toContain('App Preferences')
    expect(wrapper.text()).toContain('Blocked Titles')
    expect(wrapper.text()).toContain('Movies Added')
  })
})
