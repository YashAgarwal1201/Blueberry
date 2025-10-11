import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'
import ToastService from 'primevue/toastservice'

import './styles.css'
import { ConfirmationService } from 'primevue'

if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('watermelon-theme') || 'system'
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (systemDark) document.documentElement.classList.add('dark')
  }
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})
app.use(ConfirmationService)
app.use(ToastService)

app.mount('#app')
