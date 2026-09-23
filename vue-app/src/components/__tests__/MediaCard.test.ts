import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MediaCard from '../MediaCard.vue'

describe('MediaCard.vue', () => {
  it('renders title, year, and type correctly', () => {
    const wrapper = mount(MediaCard, {
      props: {
        title: 'Inception',
        year: 2010,
        type: 'Movie'
      }
    })
    
    expect(wrapper.text()).toContain('Inception')
    expect(wrapper.text()).toContain('2010')
    expect(wrapper.text()).toContain('Movie')
  })

  it('renders "N/A" when year is not provided', () => {
    const wrapper = mount(MediaCard, {
      props: {
        title: 'Unknown Title',
        type: 'Show'
      }
    })
    
    expect(wrapper.text()).toContain('N/A')
  })

  it('renders poster image if posterUrl is provided', () => {
    const wrapper = mount(MediaCard, {
      props: {
        title: 'Avatar',
        type: 'Movie',
        posterUrl: 'http://example.com/poster.jpg'
      }
    })
    
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('http://example.com/poster.jpg')
    expect(img.attributes('alt')).toBe('Avatar')
  })

  it('renders "No Poster" text if posterUrl is not provided', () => {
    const wrapper = mount(MediaCard, {
      props: {
        title: 'Avatar',
        type: 'Movie'
      }
    })
    
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('No Poster')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(MediaCard, {
      props: {
        title: 'Inception',
        type: 'Movie'
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('applies fluid class if fluid prop is true', () => {
    const wrapper = mount(MediaCard, {
      props: {
        title: 'Inception',
        type: 'Movie',
        fluid: true
      }
    })
    
    expect(wrapper.classes()).toContain('w-full')
  })

  it('renders badge slot', () => {
    const wrapper = mount(MediaCard, {
      props: {
        title: 'Inception',
        type: 'Movie'
      },
      slots: {
        badge: '<div class="test-badge">Badge Content</div>'
      }
    })
    
    expect(wrapper.find('.test-badge').exists()).toBe(true)
    expect(wrapper.text()).toContain('Badge Content')
  })
})
