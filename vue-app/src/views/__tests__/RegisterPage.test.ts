import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterPage from '../RegisterPage.vue'

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush
  }),
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

const mockSignUpEmail = vi.fn()
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signUp: {
      email: (...args: any[]) => mockSignUpEmail(...args)
    }
  }
}))

describe('RegisterPage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignUpEmail.mockResolvedValue({ error: null, data: {} })
  })

  it('renders registration form correctly', () => {
    const wrapper = mount(RegisterPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, Check: true, X: true, Loader2: true }
      }
    })

    expect(wrapper.text()).toContain('Create Account')
    expect(wrapper.find('input#firstName').exists()).toBe(true)
    expect(wrapper.find('input#lastName').exists()).toBe(true)
    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Create Account')
  })

  it('validates email before submitting', async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, Check: true, X: true, Loader2: true }
      }
    })

    await wrapper.find('input#email').setValue('invalid-email')
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.text()).toContain('Please enter a valid email address.')
    expect(mockSignUpEmail).not.toHaveBeenCalled()
  })

  it('validates password strength before submitting', async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, Check: true, X: true, Loader2: true }
      }
    })

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('weak') // No numbers, uppercase, special chars
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.text()).toContain('Password is not strong enough')
    expect(mockSignUpEmail).not.toHaveBeenCalled()
  })

  it('submits form successfully and redirects when valid', async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, Check: true, X: true, Loader2: true }
      }
    })

    await wrapper.find('input#firstName').setValue('John')
    await wrapper.find('input#lastName').setValue('Doe')
    await wrapper.find('input#email').setValue('test@example.com')
    // A strong password matching the regexes: length >= 8, upper, lower, number, special
    await wrapper.find('input#password').setValue('Strong!Password123')
    
    await wrapper.find('form').trigger('submit')
    
    expect(mockSignUpEmail).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Strong!Password123',
      name: 'John Doe'
    })
    
    await new Promise(r => setTimeout(r, 0))
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })

  it('displays error on registration failure', async () => {
    mockSignUpEmail.mockResolvedValueOnce({
      error: { message: 'Email already exists' }
    })

    const wrapper = mount(RegisterPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, Check: true, X: true, Loader2: true }
      }
    })

    await wrapper.find('input#firstName').setValue('John')
    await wrapper.find('input#lastName').setValue('Doe')
    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('Strong!Password123')
    
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))
    
    expect(wrapper.text()).toContain('Email already exists')
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
