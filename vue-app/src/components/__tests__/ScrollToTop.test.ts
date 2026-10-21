import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ScrollToTop from '../ScrollToTop.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/' }),
}))

describe('ScrollToTop.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
  })

  it('is initially hidden when not scrolled', () => {
    const wrapper = mount(ScrollToTop)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('scrolls to top when clicked after page scroll', async () => {
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
    const wrapper = mount(ScrollToTop)
    document.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)

    await button.trigger('click')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
