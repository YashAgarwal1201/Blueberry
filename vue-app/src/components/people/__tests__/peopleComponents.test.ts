import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PersonAddDialog from '../PersonAddDialog.vue'
import PersonProfileDrawer from '../PersonProfileDrawer.vue'
import type { Person } from 'shared-types'

describe('People Components', () => {
  describe('PersonAddDialog.vue', () => {
    it('validates required name field before emitting submit', async () => {
      const wrapper = mount(PersonAddDialog, {
        props: {
          visible: true,
          loading: false,
        },
        global: {
          stubs: {
            Dialog: {
              props: ['visible'],
              template: '<div v-if="visible" class="p-dialog"><slot /><slot name="footer" /></div>',
            },
            InputText: {
              props: ['modelValue'],
              emits: ['update:modelValue'],
              template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            },
            Textarea: true,
            InputNumber: true,
            Button: {
              props: ['label'],
              template: '<button>{{ label }}</button>',
            },
            AppImage: true,
          },
        },
      })

      // Try submitting without a name
      const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Person'))
      expect(submitBtn).toBeDefined()
      await submitBtn!.trigger('click')

      expect(wrapper.text()).toContain('Name is required')
      expect(wrapper.emitted('submit')).toBeFalsy()

      // Fill name
      const nameInput = wrapper.findAll('input')[0]
      expect(nameInput).toBeDefined()
      await nameInput!.setValue('Cillian Murphy')

      await submitBtn!.trigger('click')
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')?.[0]).toEqual([
        expect.objectContaining({ name: 'Cillian Murphy' }),
      ])
    })

    it('emits update:visible false when Cancel button is clicked', async () => {
      const wrapper = mount(PersonAddDialog, {
        props: {
          visible: true,
          loading: false,
        },
        global: {
          stubs: {
            Dialog: {
              props: ['visible'],
              template: '<div v-if="visible"><slot /><slot name="footer" /></div>',
            },
            InputText: true,
            Textarea: true,
            InputNumber: true,
            Button: {
              props: ['label'],
              template: '<button>{{ label }}</button>',
            },
          },
        },
      })

      const cancelBtn = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      await cancelBtn!.trigger('click')

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')![0]).toEqual([false])
    })
  })

  describe('PersonProfileDrawer.vue', () => {
    const mockPerson: Person = {
      id: 42,
      name: 'Emma Stone',
      also_known_as: 'Emily Jean Stone',
      bio: 'Award-winning actress.',
      birth_date: '1988-11-06',
      birth_place: 'Scottsdale, Arizona, USA',
      profile_url: 'https://example.com/emma.jpg',
      imdb_id: 'nm1297015',
      tmdb_id: 54693,
    } as unknown as Person

    const mockFilmography = [
      {
        id: 1,
        uuid: 'la-la-land',
        title: 'La La Land',
        release_year: 2016,
        poster_url: 'https://example.com/lalaland.jpg',
        role: 'actor',
        character: 'Mia Dolan',
      },
    ]

    it('renders person details, badges, and filmography', () => {
      const wrapper = mount(PersonProfileDrawer, {
        props: {
          visible: true,
          person: mockPerson,
          filmography: mockFilmography,
          filmographyLoading: false,
          filmographyLoaded: true,
          deleting: false,
        },
        global: {
          stubs: {
            Drawer: {
              props: ['visible'],
              template: '<div v-if="visible" class="p-drawer"><slot /></div>',
            },
            Button: {
              props: ['label'],
              template: '<button><slot />{{ label }}</button>',
            },
            Tag: {
              props: ['value'],
              template: '<span>{{ value }}</span>',
            },
            Skeleton: true,
            AppImage: true,
            RouterLink: {
              props: ['to'],
              template: '<a :href="to"><slot /></a>',
            },
          },
        },
      })

      expect(wrapper.text()).toContain('Emma Stone')
      expect(wrapper.text()).toContain('Emily Jean Stone')
      expect(wrapper.text()).toContain('Scottsdale, Arizona, USA')
      expect(wrapper.text()).toContain('1988-11-06')
      expect(wrapper.text()).toContain('Award-winning actress.')
      expect(wrapper.text()).toContain('IMDb: nm1297015')
      expect(wrapper.text()).toContain('TMDB: 54693')
      expect(wrapper.text()).toContain('La La Land')
      expect(wrapper.text()).toContain('Mia Dolan')
    })

    it('emits edit, delete, and load-filmography events', async () => {
      const wrapper = mount(PersonProfileDrawer, {
        props: {
          visible: true,
          person: mockPerson,
          filmography: [],
          filmographyLoading: false,
          filmographyLoaded: false,
          deleting: false,
        },
        global: {
          stubs: {
            Drawer: {
              props: ['visible'],
              template: '<div v-if="visible"><slot /></div>',
            },
            Button: {
              props: ['label'],
              template: '<button><slot />{{ label }}</button>',
            },
            Tag: true,
            Skeleton: true,
            AppImage: true,
            RouterLink: true,
          },
        },
      })

      // Edit button
      const editBtn = wrapper.findAll('button').find((b) => b.text().includes('Edit'))
      await editBtn!.trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()

      // Load filmography button
      const loadBtn = wrapper.findAll('button').find((b) => b.text().includes('Load'))
      await loadBtn!.trigger('click')
      expect(wrapper.emitted('load-filmography')).toBeTruthy()

      // Delete button
      const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Delete Person'))
      await deleteBtn!.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })
})
