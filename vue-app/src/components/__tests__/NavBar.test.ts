import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import NavBar from '../NavBar.vue'
import { useMainStore } from '@/stores/mainStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to"><slot></slot></a>'
  }
}))

describe('NavBar.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders all default links when preferences allow', () => {
    const preferencesStore = usePreferencesStore()
    preferencesStore.showMovies = true
    preferencesStore.showShows = true
    preferencesStore.showPeople = true

    const wrapper = mount(NavBar, {
      global: {
        stubs: {
          Menu: true
        }
      }
    })

    const links = wrapper.findAll('a')
    // Home, Movies, Shows, Genres, People, Profile
    expect(links).toHaveLength(6)
    
    const toProps = links.map(link => link.attributes('href'))
    expect(toProps).toEqual(['/', '/movies', '/shows', '/genres', '/people', '/profile'])
  })

  it('hides links based on preferences', () => {
    const preferencesStore = usePreferencesStore()
    preferencesStore.showMovies = false
    preferencesStore.showShows = false
    preferencesStore.showPeople = false

    const wrapper = mount(NavBar, {
      global: {
        stubs: {
          Menu: true
        }
      }
    })

    const links = wrapper.findAll('a')
    // Home, Genres, Profile
    expect(links).toHaveLength(3)
    
    const toProps = links.map(link => link.attributes('href'))
    expect(toProps).toEqual(['/', '/genres', '/profile'])
  })

  it('toggles side menu when menu button is clicked', async () => {
    const mainStore = useMainStore()
    mainStore.showSideMenu = false

    const wrapper = mount(NavBar, {
      global: {
        stubs: {
          Menu: true
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(mainStore.showSideMenu).toBe(true)
  })
})
