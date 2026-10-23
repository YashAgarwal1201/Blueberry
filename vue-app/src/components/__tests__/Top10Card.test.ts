import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Top10Card from '../Top10Card.vue'
import type { MediaCard } from 'shared-types'

describe('Top10Card.vue', () => {
  const mockMovie: MediaCard = {
    id: 1,
    uuid: 'movie-uuid-1',
    type: 'movie',
    title: 'Inception',
    poster_url: 'https://example.com/poster.jpg',
    release_year: 2010,
    status: 'released',
    in_watchlist: false,
  }

  const mockShow: MediaCard = {
    id: 2,
    uuid: 'show-uuid-2',
    type: 'tv',
    title: 'Breaking Bad',
    poster_url: 'https://example.com/show.jpg',
    release_year: 2008,
    status: 'ended',
    in_watchlist: false,
  }

  it('renders rank number and title correctly', () => {
    const wrapper = mount(Top10Card, {
      props: {
        item: mockMovie,
        rank: 1,
      },
      global: {
        stubs: {
          AppImage: {
            template: '<div class="app-image-stub"><slot /></div>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('Inception')
    expect(wrapper.text()).toContain('2010')
    expect(wrapper.text()).toContain('#1')
  })

  it('renders tv series rank and title correctly', () => {
    const wrapper = mount(Top10Card, {
      props: {
        item: mockShow,
        rank: 4,
      },
      global: {
        stubs: {
          AppImage: {
            template: '<div class="app-image-stub"><slot /></div>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('4')
    expect(wrapper.text()).toContain('Breaking Bad')
    expect(wrapper.text()).toContain('2008')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(Top10Card, {
      props: {
        item: mockMovie,
        rank: 1,
      },
      global: {
        stubs: {
          AppImage: {
            template: '<div class="app-image-stub"><slot /></div>',
          },
        },
      },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
