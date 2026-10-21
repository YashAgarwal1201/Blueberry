import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CastEditor from '../CastEditor.vue'
import { usePeopleStore } from '@/stores/peopleStore'
import type { CastMemberRequest, Person } from 'shared-types'

describe('CastEditor.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const existingCast: CastMemberRequest[] = [
    {
      person_id: 1,
      name: 'Leonardo DiCaprio',
      profile_url: 'https://example.com/leo.jpg',
      role: 'actor',
      character: 'Dom Cobb',
      display_order: 0,
    },
    {
      person_id: 2,
      name: 'Christopher Nolan',
      profile_url: undefined,
      role: 'director',
      display_order: 1,
    },
  ]

  it('renders empty state when modelValue is empty', () => {
    const wrapper = mount(CastEditor, {
      props: {
        modelValue: [],
      },
      global: {
        stubs: { AppImage: true },
      },
    })

    expect(wrapper.text()).toContain('No cast members added yet. Search above to add.')
  })

  it('renders existing cast members with name, role, and character', () => {
    const wrapper = mount(CastEditor, {
      props: {
        modelValue: existingCast,
      },
      global: {
        stubs: { AppImage: true },
      },
    })

    expect(wrapper.text()).toContain('Leonardo DiCaprio')
    expect(wrapper.text()).toContain('Dom Cobb')
    expect(wrapper.text()).toContain('Christopher Nolan')
    expect(wrapper.text()).toContain('Director')
  })

  it('removes a cast member and emits update:modelValue', async () => {
    const wrapper = mount(CastEditor, {
      props: {
        modelValue: existingCast,
      },
      global: {
        stubs: { AppImage: true },
      },
    })

    const removeButtons = wrapper.findAll('button').filter((b) => b.attributes('type') === 'button' && b.find('svg').exists())
    const firstRemove = removeButtons[0]
    expect(firstRemove).toBeDefined()
    await firstRemove!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedEvents = wrapper.emitted('update:modelValue')
    const emittedList = (emittedEvents?.[0]?.[0] as CastMemberRequest[] | undefined) ?? []
    expect(emittedList).toHaveLength(1)
    expect(emittedList[0]?.person_id).toBe(2)
  })

  it('searches people on input with debounce and selects a person', async () => {
    const peopleStore = usePeopleStore()
    const mockPerson = {
      id: 3,
      name: 'Joseph Gordon-Levitt',
      profile_url: null,
    } as unknown as Person
    peopleStore.searchPeople = vi.fn().mockResolvedValue([mockPerson])

    const wrapper = mount(CastEditor, {
      props: {
        modelValue: existingCast,
      },
      global: {
        stubs: { AppImage: true },
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.trigger('focus')
    await input.setValue('Joseph')

    vi.advanceTimersByTime(350)
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    expect(peopleStore.searchPeople).toHaveBeenCalledWith('Joseph')

    // Click on search result
    const resultButton = wrapper.findAll('button').find((b) => b.text().includes('Joseph Gordon-Levitt'))
    expect(resultButton).toBeDefined()
    await resultButton!.trigger('mousedown')

    // Pending panel should now be visible
    expect(wrapper.text()).toContain('Joseph Gordon-Levitt')
    expect(wrapper.text()).toContain('Role *')

    // Fill character name and click "Add to Cast"
    const charInput = wrapper.find('input[placeholder="Character they play"]')
    await charInput.setValue('Arthur')

    const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add to Cast')
    await addBtn!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedEvents = wrapper.emitted('update:modelValue')
    const updated = (emittedEvents?.[0]?.[0] as CastMemberRequest[] | undefined) ?? []
    expect(updated).toHaveLength(3)
    expect(updated[2]?.name).toBe('Joseph Gordon-Levitt')
    expect(updated[2]?.character).toBe('Arthur')
  })

  it('creates a new person inline when create button is clicked', async () => {
    const peopleStore = usePeopleStore()
    const newPerson = {
      id: 99,
      name: 'New Actor',
      profile_url: 'https://new.com/pic.jpg',
    } as unknown as Person
    peopleStore.searchPeople = vi.fn().mockResolvedValue([])
    peopleStore.createPerson = vi.fn().mockResolvedValue(newPerson)

    const wrapper = mount(CastEditor, {
      props: {
        modelValue: [],
      },
      global: {
        stubs: { AppImage: true },
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.trigger('focus')
    await input.setValue('New Actor')

    vi.advanceTimersByTime(350)
    await vi.runAllTimersAsync()
    await wrapper.vm.$nextTick()

    const createPromptBtn = wrapper.findAll('button').find((b) => b.text().includes('Create "New Actor" as new person'))
    expect(createPromptBtn).toBeDefined()
    await createPromptBtn!.trigger('mousedown')

    // The inline form opens
    expect(wrapper.text()).toContain('New Person')

    const createAndAddBtn = wrapper.findAll('button').find((b) => b.text().includes('Create & Add to Cast'))
    await createAndAddBtn!.trigger('click')
    await vi.runAllTimersAsync()

    expect(peopleStore.createPerson).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Actor' }))
    expect(wrapper.text()).toContain('New Actor')
  })
})
