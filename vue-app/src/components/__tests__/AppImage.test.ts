import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppImage from '../AppImage.vue'

describe('AppImage.vue', () => {
  it('renders image when src is provided', () => {
    const wrapper = mount(AppImage, {
      props: {
        src: 'https://example.com/poster.jpg',
        alt: 'Test Poster',
        type: 'movie',
      },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/poster.jpg')
    expect(img.attributes('alt')).toBe('Test Poster')
  })

  it('renders fallback icon when src is null', () => {
    const wrapper = mount(AppImage, {
      props: {
        src: null,
        type: 'movie',
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    // Film fallback icon renders as svg
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('switches to fallback when image triggers error', async () => {
    const wrapper = mount(AppImage, {
      props: {
        src: 'https://example.com/broken.jpg',
        type: 'tv',
      },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)

    await img.trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders slot content over the image', () => {
    const wrapper = mount(AppImage, {
      props: {
        src: 'https://example.com/poster.jpg',
      },
      slots: {
        default: '<div class="custom-overlay">Badge</div>',
      },
    })

    expect(wrapper.find('.custom-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Badge')
  })
})
