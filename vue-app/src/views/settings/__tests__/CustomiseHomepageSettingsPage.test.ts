import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CustomiseHomepageSettingsPage from '../CustomiseHomepageSettingsPage.vue'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ value: { isPending: false, data: null } }),
  },
}))

vi.mock('@/services/apiInterceptors', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, genres: [], languages: [] } }),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}))

vi.mock('@/composables/toastHandler', () => ({
  default: () => ({
    showToast: vi.fn(),
  }),
}))

describe('CustomiseHomepageSettingsPage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders login required state when not authenticated', () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = false

    const wrapper = mount(CustomiseHomepageSettingsPage, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    expect(wrapper.text()).toContain('Login Required')
    expect(wrapper.text()).toContain('You must be logged in to customise your app experience')
  })

  it('renders preference settings when authenticated and allows saving changes', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true

    const prefs = usePreferencesStore()
    prefs.savePreferences = vi.fn().mockResolvedValue(true)
    prefs.showMovies = true

    const wrapper = mount(CustomiseHomepageSettingsPage, {
      global: {
        stubs: { RouterLink: true, MultiSelect: true },
      },
    })

    expect(wrapper.text()).toContain('App Preferences')
    expect(wrapper.text()).toContain('Content Visibility')
    expect(wrapper.text()).toContain('Movies')

    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 20))
    await wrapper.vm.$nextTick()

    // Click the toggle div
    const toggleRows = wrapper.findAll('.cursor-pointer')
    expect(toggleRows.length).toBeGreaterThan(0)
    expect(toggleRows[0]).toBeDefined()
    await toggleRows[0]!.trigger('click')
    await wrapper.vm.$nextTick()

    // Find Save button in footer
    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Preferences'))
    expect(saveButton).toBeDefined()
    expect(saveButton?.attributes('disabled')).toBeUndefined()
    if (saveButton) {
      await saveButton.trigger('click')
      expect(prefs.savePreferences).toHaveBeenCalled()
    }
  })
})
