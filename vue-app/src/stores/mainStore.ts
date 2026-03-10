import { ref } from 'vue'
import { defineStore } from 'pinia'

export type BackendStatus = 'unknown' | 'online' | 'offline'

export type SelectedBackend = {
  title: string
  url: string
  status: BackendStatus
}

export const useMainStore = defineStore('mainStore', () => {
  const backend = ref<SelectedBackend>({
    title: '',
    url: '',
    status: 'unknown' as BackendStatus,
  })
  const showSideMenu = ref<boolean>(false)

  const backends = [
    {
      title: 'Express',
      url: 'http://localhost:8100',
    },
    {
      title: 'Fast API',
      url: 'http://localhost:8000',
    },
  ]

  async function checkBackendHealth(url: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(`${url}/health`, { signal: controller.signal })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        return data.status === 'ok'
      }
      return false
    } catch (err) {
      console.log("Looks like there's some error while getting the backend status: ", err)
      return false
    }
  }

  async function selectBackend(url: string) {
    const isAlive = await checkBackendHealth(url)
    backend.value = {
      title: backends.find((b) => b.url === url)?.title ?? '',
      url,
      status: isAlive ? ('online' as BackendStatus) : ('offline' as BackendStatus),
    }
  }

  const toggleSideMenu = () => {
    showSideMenu.value = !showSideMenu.value
  }

  return { backend, backends, showSideMenu, selectBackend, checkBackendHealth, toggleSideMenu }
})
