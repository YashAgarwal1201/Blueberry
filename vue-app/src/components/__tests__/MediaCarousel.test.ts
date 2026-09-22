import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MediaCarousel from '../MediaCarousel.vue'

describe('MediaCarousel.vue', () => {
  it('renders slot content', () => {
    const wrapper = mount(MediaCarousel, {
      slots: {
        default: '<div class="test-item">Carousel Item</div>'
      }
    })
    
    expect(wrapper.find('.test-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('Carousel Item')
  })

  it('applies correct classes for scroll and snap', () => {
    const wrapper = mount(MediaCarousel)
    
    const scrollContainer = wrapper.find('div.flex')
    expect(scrollContainer.classes()).toContain('overflow-x-auto')
    expect(scrollContainer.classes()).toContain('snap-x')
    expect(scrollContainer.classes()).toContain('snap-mandatory')
    expect(scrollContainer.classes()).toContain('hide-scrollbar')
  })
})
