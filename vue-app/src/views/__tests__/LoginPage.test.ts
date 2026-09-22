import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginPage from '../LoginPage.vue'

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush
  }),
  RouterLink: {
    template: '<a><slot></slot></a>'
  }
}))

const mockSignInEmail = vi.fn()
const mockSignInMagicLink = vi.fn()
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: (...args: any[]) => mockSignInEmail(...args),
      magicLink: (...args: any[]) => mockSignInMagicLink(...args)
    }
  }
}))

describe('LoginPage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignInEmail.mockResolvedValue({ error: null, data: {} })
    mockSignInMagicLink.mockResolvedValue({ error: null, data: {} })
  })

  it('renders login form correctly', () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: {
          GoBackButton: true,
          RouterLink: true,
          Check: true,
          X: true,
          Loader2: true
        }
      }
    })

    expect(wrapper.text()).toContain('Welcome Back')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Sign In')
  })

  it('validates email before submitting', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, Check: true, X: true, Loader2: true }
      }
    })

    // Set invalid email
    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('invalid-email')
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.text()).toContain('Please enter a valid email address.')
    expect(mockSignInEmail).not.toHaveBeenCalled()
  })

  it('submits form successfully and redirects', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, Check: true, X: true, Loader2: true }
      }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    await wrapper.find('form').trigger('submit')
    
    expect(mockSignInEmail).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
    
    // Wait for promises to resolve
    await new Promise(r => setTimeout(r, 0))
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })

  it('displays error on login failure', async () => {
    mockSignInEmail.mockResolvedValueOnce({
      error: { message: 'Invalid credentials' }
    })

    const wrapper = mount(LoginPage, {
      global: {
        stubs: { GoBackButton: true, RouterLink: true, Check: true, X: true, Loader2: true }
      }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    await wrapper.find('form').trigger('submit')
    await new Promise(r => setTimeout(r, 0))
    
    expect(wrapper.text()).toContain('Invalid credentials')
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
