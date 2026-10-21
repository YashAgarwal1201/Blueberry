import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AdminUsersSettingsPage from '../AdminUsersSettingsPage.vue'
import { authClient } from '@/lib/auth-client'

import { ref } from 'vue'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ref({ isPending: false, data: { user: { id: 'u-admin', role: 'admin' } } }),
    admin: {
      listUsers: vi.fn(),
      setRole: vi.fn(),
      banUser: vi.fn(),
      unbanUser: vi.fn(),
    },
  },
}))

vi.mock('@/composables/toastHandler', () => ({
  default: () => ({
    showToast: vi.fn(),
  }),
}))

describe('AdminUsersSettingsPage.vue', () => {
  const mockUsers = [
    {
      id: 'u1',
      name: 'Alice Admin',
      email: 'alice@example.com',
      role: 'admin',
      banned: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'u2',
      name: 'Bob Moderator',
      email: 'bob@example.com',
      role: 'moderator',
      banned: false,
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'u3',
      name: 'Charlie User',
      email: 'charlie@example.com',
      role: 'user',
      banned: true,
      banReason: 'Abuse',
      createdAt: '2026-01-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(authClient.admin.listUsers).mockResolvedValue({
      data: { users: JSON.parse(JSON.stringify(mockUsers)) },
    } as never)
  })

  it('renders stats, table, and user rows after loading', async () => {
    const wrapper = mount(AdminUsersSettingsPage, {
      global: {
        stubs: {
          Dialog: {
            props: ['visible'],
            template: '<div v-if="visible" class="dialog-stub"><slot /><slot name="footer" /></div>',
          },
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('User Management')
    // Check stats: 3 Total Users, 2 Staff, 1 Suspended
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('1')

    // Check user table content
    expect(wrapper.text()).toContain('Alice Admin')
    expect(wrapper.text()).toContain('Bob Moderator')
    expect(wrapper.text()).toContain('Charlie User')
    expect(wrapper.text()).toContain('Suspended')
  })

  it('filters user list by search query', async () => {
    const wrapper = mount(AdminUsersSettingsPage, {
      global: {
        stubs: {
          Dialog: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('charlie')

    expect(wrapper.text()).toContain('Charlie User')
    expect(wrapper.text()).not.toContain('Alice Admin')
    expect(wrapper.text()).not.toContain('Bob Moderator')
  })

  it('filters user list by role filter', async () => {
    const wrapper = mount(AdminUsersSettingsPage, {
      global: {
        stubs: {
          Dialog: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const roleSelect = wrapper.find('select')
    await roleSelect.setValue('moderator')

    expect(wrapper.text()).toContain('Bob Moderator')
    expect(wrapper.text()).not.toContain('Alice Admin')
    expect(wrapper.text()).not.toContain('Charlie User')
  })

  it('opens role dialog and changes user role', async () => {
    vi.mocked(authClient.admin.setRole).mockResolvedValue({ data: { success: true } } as never)

    const wrapper = mount(AdminUsersSettingsPage, {
      global: {
        stubs: {
          Dialog: {
            props: ['visible'],
            template: '<div v-if="visible" class="dialog-stub"><slot /><slot name="footer" /></div>',
          },
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // Find change role button
    const roleButtons = wrapper.findAll('button[title="Change user role"]')
    expect(roleButtons.length).toBeGreaterThan(0)
    expect(roleButtons[0]).toBeDefined()
    await roleButtons[0]!.trigger('click')

    expect(wrapper.find('.dialog-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Assign a new role')

    // Confirm role save
    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save Role'))
    expect(saveButton).toBeDefined()
    if (saveButton) {
      await saveButton.trigger('click')
      expect(authClient.admin.setRole).toHaveBeenCalled()
    }
  })

  it('opens ban dialog and confirms account suspension', async () => {
    vi.mocked(authClient.admin.banUser).mockResolvedValue({ data: { success: true } } as never)

    const wrapper = mount(AdminUsersSettingsPage, {
      global: {
        stubs: {
          Dialog: {
            props: ['visible'],
            template: '<div v-if="visible" class="dialog-stub"><slot /><slot name="footer" /></div>',
          },
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // Bob Moderator (index 1) can be suspended (admin cannot be suspended)
    const suspendButtons = wrapper.findAll('button[title="Suspend user account"]')
    expect(suspendButtons.length).toBeGreaterThan(1)
    expect(suspendButtons[1]).toBeDefined()
    await suspendButtons[1]!.trigger('click')

    expect(wrapper.find('.dialog-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Suspend Account')

    const confirmBanBtn = wrapper.findAll('button').find(b => b.text().includes('Suspend Account'))
    expect(confirmBanBtn).toBeDefined()
    if (confirmBanBtn) {
      await confirmBanBtn.trigger('click')
      expect(authClient.admin.banUser).toHaveBeenCalled()
    }
  })

  it('calls unbanUser when lift suspension is clicked', async () => {
    vi.mocked(authClient.admin.unbanUser).mockResolvedValue({ data: { success: true } } as never)

    const wrapper = mount(AdminUsersSettingsPage, {
      global: {
        stubs: {
          Dialog: true,
        },
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const liftButton = wrapper.find('button[title="Unban user"]')
    expect(liftButton.exists()).toBe(true)
    await liftButton.trigger('click')

    expect(authClient.admin.unbanUser).toHaveBeenCalledWith({ userId: 'u3' })
  })
})
