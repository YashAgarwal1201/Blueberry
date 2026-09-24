import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MediaCarousel from '../MediaCarousel.vue'

describe('MediaCarousel.vue', () => {
  it('renders scoped slot content for each item', () => {
    const items = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
    
    const wrapper = mount(MediaCarousel, {
      props: { items },
      slots: {
        default: `<template #default="{ item }"><div class="test-item">{{ item.name }}</div></template>`
      }
    })
    
    const renderedItems = wrapper.findAll('.test-item')
    expect(renderedItems).toHaveLength(2)
    expect(renderedItems[0]!.text()).toBe('Item 1')
    expect(renderedItems[1]!.text()).toBe('Item 2')
  })
})
