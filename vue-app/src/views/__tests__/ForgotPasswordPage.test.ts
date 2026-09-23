import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ForgotPasswordPage from '../ForgotPasswordPage.vue'

const mockForgetPassword = vi.fn()
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    forgetPassword: (...args: any[]) => mockForgetPassword(...args)
  }
}))

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

describe('ForgotPasswordPage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockForgetPassword.mockResolvedValue({ error: null, data: {} })
  })

  it('renders form correctly', () => {
    const wrapper = mount(ForgotPasswordPage, {
      global: {
        stubs: { RouterLink: true, Loader2: true, ArrowLeft: true }
      }
    })

    expect(wrapper.text()).toContain('Forgot Password')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Send Reset Link')
  })

  it('validates email before submitting', async () => {
    const wrapper = mount(ForgotPasswordPage, {
      global: {
        stubs: { RouterLink: true, Loader2: true, ArrowLeft: true }
      }
    })

    await wrapper.find('input[type="email"]').setValue('invalid-email')
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.text()).toContain('Please enter a valid email address.')
    expect(mockForgetPassword).not.toHaveBeenCalled()
  })

  it('submits successfully and shows success message', async () => {
    const wrapper = mount(ForgotPasswordPage, {
      global: {
        stubs: { RouterLink: true, Loader2: true, ArrowLeft: true }
      }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('form').trigger('submit')
    
    expect(mockForgetPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      redirectTo: 'http://localhost:5130/reset-password'
    })
    
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.text()).toContain('Check your email')
    expect(wrapper.text()).toContain('If an account exists for test@example.com')
  })

  it('displays error on API failure', async () => {
    mockForgetPassword.mockResolvedValueOnce({
      error: { message: 'Server error' }
    })

    const wrapper = mount(ForgotPasswordPage, {
      global: {
        stubs: { RouterLink: true, Loader2: true, ArrowLeft: true }
      }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))
    
    expect(wrapper.text()).toContain('Server error')
  })
})
