import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchResultRow from '../SearchResultRow.vue'
import SearchEmptyState from '../SearchEmptyState.vue'
import { useSearchStore } from '@/stores/searchStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { MovieWithDetails, Person } from 'shared-types'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockRecentList = [{ query: 'Matrix' }, { query: 'Avatar' }]

vi.mock('@/services/db', () => ({
  db: {
    recentSearches: {
      orderBy: () => ({
        reverse: () => ({
          toArray: vi.fn().mockImplementation(async () => [...mockRecentList]),
        }),
      }),
      where: () => ({
        equals: () => ({
          first: vi.fn().mockResolvedValue({ id: 1, query: 'Matrix' }),
        }),
      }),
      add: vi.fn().mockResolvedValue(1),
      count: vi.fn().mockResolvedValue(2),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

describe('Search Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('SearchResultRow.vue', () => {
    it('renders movie media details and emits click when clicked', async () => {
      const mockMovie = {
        id: 1,
        title: 'Interstellar',
        poster_url: 'https://image.tmdb.org/poster.jpg',
        release_year: 2014,
        genres: [{ id: 1, name: 'Sci-Fi' }, { id: 2, name: 'Drama' }],
      }

      const wrapper = mount(SearchResultRow, {
        props: {
          type: 'movie',
          item: mockMovie as unknown as MovieWithDetails,
        },
        global: {
          stubs: { AppImage: true },
        },
      })

      expect(wrapper.text()).toContain('Interstellar')
      expect(wrapper.text()).toContain('movie')
      expect(wrapper.text()).toContain('2014')
      expect(wrapper.text()).toContain('Sci-Fi')
      expect(wrapper.text()).toContain('Drama')

      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
    })

    it('renders person details and aliases', () => {
      const mockPerson = {
        id: 5,
        name: 'Christian Bale',
        also_known_as: 'Bruce Wayne',
        profile_url: 'https://image.tmdb.org/person.jpg',
      }

      const wrapper = mount(SearchResultRow, {
        props: {
          type: 'person',
          item: mockPerson as unknown as Person,
        },
        global: {
          stubs: { AppImage: true },
        },
      })

      expect(wrapper.text()).toContain('Christian Bale')
      expect(wrapper.text()).toContain('aka Bruce Wayne')
    })
  })

  describe('SearchEmptyState.vue', () => {
    it('renders recent searches and handles search and remove actions', async () => {
      const searchStore = useSearchStore()
      searchStore.recentSearches = ['Matrix', 'Avatar']
      const removeSpy = vi.spyOn(searchStore, 'removeRecent').mockResolvedValue()
      const clearSpy = vi.spyOn(searchStore, 'clearRecent').mockResolvedValue()

      const wrapper = mount(SearchEmptyState)

      expect(wrapper.text()).toContain('Recent Searches')
      expect(wrapper.text()).toContain('Matrix')
      expect(wrapper.text()).toContain('Avatar')

      // Click on search term
      const termSpan = wrapper.findAll('span').find((s) => s.text() === 'Matrix')
      await termSpan!.trigger('click')
      expect(wrapper.emitted('search')).toBeTruthy()
      expect(wrapper.emitted('search')?.[0]).toEqual(['Matrix'])

      // Click remove on term
      await wrapper.vm.$nextTick()
      const removeBtns = wrapper.findAll('.rounded-full.bg-surface-2 button')
      const firstRemove = removeBtns[0]
      expect(firstRemove).toBeDefined()
      await firstRemove!.trigger('click')
      expect(removeSpy).toHaveBeenCalledWith('Matrix')

      // Click Clear all
      const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Clear all'))
      await clearBtn!.trigger('click')
      expect(clearSpy).toHaveBeenCalled()
    })

    it('renders browse by type buttons and navigates to correct routes', async () => {
      const preferencesStore = usePreferencesStore()
      preferencesStore.showPeople = true

      const wrapper = mount(SearchEmptyState)

      const buttons = wrapper.findAll('button').filter((b) =>
        b.text().includes('Movies') || b.text().includes('Shows') || b.text().includes('People')
      )
      expect(buttons).toHaveLength(3)

      const moviesBtn = buttons.find((b) => b.text().includes('Movies'))
      await moviesBtn!.trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/movies')

      const showsBtn = buttons.find((b) => b.text().includes('Shows'))
      await showsBtn!.trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/shows')

      const peopleBtn = buttons.find((b) => b.text().includes('People'))
      await peopleBtn!.trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/people')
    })
  })
})
