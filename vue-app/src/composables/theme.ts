// File: composables/theme.ts

import { onMounted, ref, watch } from 'vue'

const THEME_KEY = 'blueberry-theme'

export const useTheme = () => {
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const isDark = ref(false)

  const isClient = typeof window !== 'undefined'

  const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
    theme.value = newTheme
    if (!isClient) return
    localStorage.setItem(THEME_KEY, newTheme)
    applyTheme(newTheme)
  }

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    if (!isClient) return

    const root = document.documentElement

    if (selectedTheme === 'dark') {
      root.classList.add('dark')
      isDark.value = true
    } else if (selectedTheme === 'light') {
      root.classList.remove('dark')
      isDark.value = false
    } else {
      // System preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemDark) {
        root.classList.add('dark')
        isDark.value = true
      } else {
        root.classList.remove('dark')
        isDark.value = false
      }
    }
  }

  const initTheme = () => {
    if (!isClient) return

    // migrate old key
    const legacy = localStorage.getItem('watermelon-theme')
    if (legacy) {
      localStorage.setItem(THEME_KEY, legacy)
      localStorage.removeItem('watermelon-theme')
    }

    const savedTheme = (localStorage.getItem(THEME_KEY) as 'light' | 'dark' | 'system') || 'system'
    theme.value = savedTheme
    applyTheme(savedTheme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme.value === 'system') applyTheme('system')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }

  onMounted(() => {
    const cleanup = initTheme()
    return cleanup
  })

  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    theme,
    isDark,
    updateTheme,
  }
}
