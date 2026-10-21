import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { reactive, defineComponent, h, shallowRef, type Component } from 'vue'
import App from '../App.vue'

const mockRoute = reactive({
  name: 'Home',
  meta: {
    hideSidebar: false,
  },
})

const currentRoutedComponent = shallowRef<Component>(defineComponent({
  render() {
    return h('div', 'routed-content')
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  RouterView: defineComponent({
    setup(_props, { slots }) {
      return () => (slots.default ? slots.default({ Component: currentRoutedComponent.value }) : null)
    },
  }),
}))

vi.mock('@/services/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('App.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockRoute.name = 'Home'
    mockRoute.meta.hideSidebar = false
    currentRoutedComponent.value = defineComponent({
      render() {
        return h('div', 'routed-content')
      },
    })
    vi.clearAllMocks()
  })

  it('renders standard shell elements when hideSidebar is false', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          NavBar: { template: '<div class="test-navbar">NavBar</div>' },
          SideMenu: { template: '<div class="test-sidemenu">SideMenu</div>' },
          ScrollToTop: { template: '<div class="test-scroll">ScrollToTop</div>' },
          Toast: true,
          RouterLink: true,
        },
      },
    })

    expect(wrapper.find('.test-navbar').exists()).toBe(true)
    expect(wrapper.find('.test-sidemenu').exists()).toBe(true)
    expect(wrapper.find('.test-scroll').exists()).toBe(true)
    expect(wrapper.text()).toContain('routed-content')
  })

  it('renders mobile navigation pills when route is Home', () => {
    mockRoute.name = 'Home'

    const wrapper = mount(App, {
      global: {
        stubs: {
          NavBar: true,
          SideMenu: true,
          ScrollToTop: true,
          Toast: true,
          RouterLink: {
            props: ['to'],
            template: '<a><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Movies')
    expect(wrapper.text()).toContain('Shows')
  })

  it('hides sidebar, navbar, and mobile pills when hideSidebar is true', () => {
    mockRoute.name = 'Watch'
    mockRoute.meta.hideSidebar = true

    const wrapper = mount(App, {
      global: {
        stubs: {
          NavBar: { template: '<div class="test-navbar">NavBar</div>' },
          SideMenu: { template: '<div class="test-sidemenu">SideMenu</div>' },
          ScrollToTop: true,
          Toast: true,
          RouterLink: true,
        },
      },
    })

    expect(wrapper.find('.test-navbar').exists()).toBe(false)
    expect(wrapper.find('.test-sidemenu').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Movies')
  })

  it('displays error boundary UI when a child component errors', async () => {
    const CrashingChild = defineComponent({
      setup() {
        throw new Error('Crash in page rendering')
      },
      render() {
        return h('div', 'child')
      },
    })

    currentRoutedComponent.value = CrashingChild

    const wrapper = mount(App, {
      global: {
        stubs: {
          NavBar: true,
          SideMenu: true,
          ScrollToTop: true,
          Toast: true,
          RouterLink: true,
        },
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Something went wrong')
    expect(wrapper.text()).toContain('Crash in page rendering')
    expect(wrapper.find('button').text()).toContain('Reload Page')
  })
})
