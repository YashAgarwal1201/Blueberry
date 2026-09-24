import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroCarousel from '../HeroCarousel.vue'

describe('HeroCarousel.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Mock scrollTo on HTMLElement
    HTMLElement.prototype.scrollTo = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const mockItems = [
    { uuid: '1', title: 'Show 1', type: 'Show', release_year: 2021, backdrop_url: 'img1.jpg' },
    { uuid: '2', title: 'Movie 1', type: 'Movie', release_year: 2022, poster_url: 'img2.jpg', status: 'returning_series' }
  ]

  it('renders items correctly', () => {
    const wrapper = mount(HeroCarousel, {
      props: {
        items: mockItems as any[]
      }
    })
    
    expect(wrapper.text()).toContain('Show 1')
    expect(wrapper.text()).toContain('2021')
    expect(wrapper.text()).toContain('Movie 1')
    expect(wrapper.text()).toContain('2022')
    expect(wrapper.text()).toContain('New Episodes')
  })

  it('emits clickItem event when clicked', async () => {
    const wrapper = mount(HeroCarousel, {
      props: {
        items: mockItems as any[]
      }
    })
    
    const firstItem = wrapper.findAll('div.cursor-pointer')[0]!
    await firstItem.trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('clickItem')
    expect(wrapper.emitted('clickItem')![0]).toEqual([mockItems[0]])
    
    const moreInfoBtn = wrapper.findAll('button')[0]!
    await moreInfoBtn.trigger('click')
    
    expect(wrapper.emitted('clickItem')![1]).toEqual([mockItems[0]])
  })

  // Auto play and pagination are now handled by Swiper internally, so we don't need to test their internal behavior.
})
