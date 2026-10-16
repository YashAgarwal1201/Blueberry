import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MoviesAddedSettingsPage from '../MoviesAddedSettingsPage.vue'

describe('MoviesAddedSettingsPage.vue', () => {
  it('renders title, description and UserAddedMovies component stub', () => {
    const wrapper = mount(MoviesAddedSettingsPage, {
      global: {
        stubs: {
          UserAddedMovies: { template: '<div class="user-added-movies-stub">User Added Movies</div>' },
        },
      },
    })

    expect(wrapper.text()).toContain('Movies added')
    expect(wrapper.text()).toContain('Following are the movies added by you.')
    expect(wrapper.find('.user-added-movies-stub').exists()).toBe(true)
  })
})
