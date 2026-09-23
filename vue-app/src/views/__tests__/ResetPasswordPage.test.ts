import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ResetPasswordPage from '../ResetPasswordPage.vue'

const mockRouterPush = vi.fn()
let mockRouteQuery: any = { token: 'valid-token' }

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush
  }),
  useRoute: () => ({
    get query() { return mockRouteQuery }
  }),
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

const mockResetPassword = vi.fn()
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    resetPassword: (...args: any[]) => mockResetPassword(...args)
  }
}))

describe('ResetPasswordPage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResetPassword.mockResolvedValue({ error: null, data: {} })
    mockRouteQuery = { token: 'valid-token' }
  })

  it('renders correctly and sets token from route', () => {
    const wrapper = mount(ResetPasswordPage, {
      global: {
        stubs: { Loader2: true }
      }
    })

    expect(wrapper.text()).toContain('Reset Password')
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('shows error if token is missing', async () => {
    mockRouteQuery = {} // No token
    
    const wrapper = mount(ResetPasswordPage, {
      global: {
        stubs: { Loader2: true }
      }
    })
    
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Invalid or missing reset token.')
  })

  it('validates password strength before submitting', async () => {
    const wrapper = mount(ResetPasswordPage, {
      global: {
        stubs: { Loader2: true }
      }
    })

    await wrapper.find('input[type="password"]').setValue('weak')
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.text()).toContain('Password is not strong enough.')
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it('submits successfully and redirects', async () => {
    const wrapper = mount(ResetPasswordPage, {
      global: {
        stubs: { Loader2: true }
      }
    })

    await wrapper.find('input[type="password"]').setValue('Strong!Password123')
    await wrapper.find('form').trigger('submit')
    
    expect(mockResetPassword).toHaveBeenCalledWith({
      newPassword: 'Strong!Password123',
      token: 'valid-token'
    })
    
    await new Promise(r => setTimeout(r, 0))
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })

  it('displays error on API failure', async () => {
    mockResetPassword.mockResolvedValueOnce({
      error: { message: 'Token expired' }
    })

    const wrapper = mount(ResetPasswordPage, {
      global: {
        stubs: { Loader2: true }
      }
    })

    await wrapper.find('input[type="password"]').setValue('Strong!Password123')
    await wrapper.find('form').trigger('submit')
    
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.text()).toContain('Token expired')
  })
})
