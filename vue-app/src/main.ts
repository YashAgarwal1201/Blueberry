import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'
import ToastService from 'primevue/toastservice'
import { ConfirmationService } from 'primevue'
import './styles.css'
import { startBackendMonitoring } from './services/apiInterceptors'

const BlueberryPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{brand.50}',
      100: '{brand.100}',
      200: '{brand.200}',
      300: '{brand.300}',
      400: '{brand.400}',
      500: '{brand.500}',
      600: '{brand.600}',
      700: '{brand.700}',
      800: '{brand.800}',
      900: '{brand.900}',
      950: '{brand.950}',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#FAF9F8',
          100: '#F3F1EF',
          200: '#ECEAE7',
          300: '#E4E1DD',
          400: '#D4D0CA',
          500: '#A9A29C',
          600: '#78716C',
          700: '#57534E',
          800: '#292524',
          900: '#1C1917',
          950: '#111110',
        },
        primary: {
          color: '{primary.600}',
          inverseColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        highlight: {
          background: '{primary.100}',
          focusBackground: '{primary.200}',
          color: '{primary.800}',
          focusColor: '{primary.900}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#FAF9F8',
          100: '#F3F1EF',
          200: '#ECEAE7',
          300: '#E4E1DD',
          400: '#D4D0CA',
          500: '#A9A29C',
          600: '#78716C',
          700: '#57534E',
          800: '#292524',
          900: '#1C1917',
          950: '#111110',
        },
        primary: {
          color: '{primary.400}',
          inverseColor: '#0D0009',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.500}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.500}, transparent 76%)',
          color: '{primary.200}',
          focusColor: '{primary.100}',
        },
      },
    },
  },
})

if (typeof window !== 'undefined') {
  // migrate old key
  const legacy = localStorage.getItem('watermelon-theme')
  if (legacy) {
    localStorage.setItem('blueberry-theme', legacy)
    localStorage.removeItem('watermelon-theme')
  }
  const savedTheme = localStorage.getItem('blueberry-theme') || 'system'
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.add('dark')
  }
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(PrimeVue, { theme: { preset: BlueberryPreset } })
app.use(ToastService)
app.use(ConfirmationService)
startBackendMonitoring()
app.mount('#app')
