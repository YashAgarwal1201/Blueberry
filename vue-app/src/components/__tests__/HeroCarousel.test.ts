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
    
    const firstItem = wrapper.findAll('div.cursor-pointer')[0]
    await firstItem.trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('clickItem')
    expect(wrapper.emitted('clickItem')![0]).toEqual([mockItems[0]])
    
    const moreInfoBtn = wrapper.findAll('button')[0]
    await moreInfoBtn.trigger('click')
    
    expect(wrapper.emitted('clickItem')![1]).toEqual([mockItems[0]])
  })

  it('auto plays when autoPlayInterval is provided', async () => {
    const wrapper = mount(HeroCarousel, {
      props: {
        items: mockItems as any[],
        autoPlayInterval: 3000
      }
    })
    
    // Trigger nextTick for onMounted
    await wrapper.vm.$nextTick()
    
    // Advance time to trigger auto play
    vi.advanceTimersByTime(3000)
    
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled()
  })

  it('updates current index on scroll', async () => {
    const wrapper = mount(HeroCarousel, {
      props: {
        items: mockItems as any[]
      }
    })
    
    const scrollContainer = wrapper.find({ ref: 'scrollContainer' })
    
    // Mock properties for scroll calculation
    Object.defineProperty(scrollContainer.element, 'scrollLeft', { value: 1000 })
    Object.defineProperty(scrollContainer.element, 'clientWidth', { value: 1000 })
    
    await scrollContainer.trigger('scroll')
    
    // Assuming we can't directly check `currentIndex`, we check the indicator classes
    // The second indicator should now be active
    const indicators = wrapper.findAll('div.rounded-full')
    expect(indicators[1].classes()).toContain('bg-primary')
  })
})
