import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMainStore } from '../mainStore'

describe('mainStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with false', () => {
    const store = useMainStore()
    expect(store.showSideMenu).toBe(false)
  })

  it('toggles side menu correctly', () => {
    const store = useMainStore()
    store.toggleSideMenu()
    expect(store.showSideMenu).toBe(true)
    store.toggleSideMenu()
    expect(store.showSideMenu).toBe(false)
  })
})
