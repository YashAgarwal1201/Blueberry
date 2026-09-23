import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GoBackButton from '../GoBackButton.vue'

// Mock vue-router
const pushMock = vi.fn()
const backMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
    back: backMock
  })
}))

describe('GoBackButton', () => {
  it('renders correctly', () => {
    const wrapper = mount(GoBackButton)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('calls router.back() when clicked without "to" prop', async () => {
    const wrapper = mount(GoBackButton)
    await wrapper.trigger('click')
    expect(backMock).toHaveBeenCalled()
  })

  it('calls router.push() when clicked with "to" prop', async () => {
    const wrapper = mount(GoBackButton, {
      props: {
        to: '/home'
      }
    })
    await wrapper.trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/home')
  })
})
