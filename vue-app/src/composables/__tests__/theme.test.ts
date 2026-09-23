import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTheme } from '../theme'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

describe('theme composable', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value }),
      removeItem: vi.fn((key: string) => { delete store[key] })
    })

    // Mock matchMedia
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))

    // Reset document class list
    document.documentElement.className = ''
  })

  it('initializes with system theme by default', () => {
    const TestComponent = defineComponent({
      setup() {
        const { theme, isDark } = useTheme()
        return { theme, isDark }
      },
      template: '<div></div>'
    })
    
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.theme).toBe('system')
    expect(wrapper.vm.isDark).toBe(false)
  })

  it('updates theme to dark', () => {
    const TestComponent = defineComponent({
      setup() {
        const { theme, isDark, updateTheme } = useTheme()
        return { theme, isDark, updateTheme }
      },
      template: '<div></div>'
    })
    
    const wrapper = mount(TestComponent)
    wrapper.vm.updateTheme('dark')
    
    expect(wrapper.vm.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    // isDark doesn't update synchronously if it relies on DOM maybe, wait, applyTheme sets it
    expect(wrapper.vm.isDark).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('blueberry-theme', 'dark')
  })

  it('updates theme to light', () => {
    const TestComponent = defineComponent({
      setup() {
        const { theme, isDark, updateTheme } = useTheme()
        return { theme, isDark, updateTheme }
      },
      template: '<div></div>'
    })
    
    const wrapper = mount(TestComponent)
    wrapper.vm.updateTheme('light')
    
    expect(wrapper.vm.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(wrapper.vm.isDark).toBe(false)
    expect(localStorage.setItem).toHaveBeenCalledWith('blueberry-theme', 'light')
  })
})
