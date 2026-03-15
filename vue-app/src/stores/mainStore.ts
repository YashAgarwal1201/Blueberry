import { ref } from 'vue'
import { defineStore } from 'pinia'

export type BackendStatus = 'unknown' | 'online' | 'offline'

export type SelectedBackend = {
  title: string
  url: string
  status: BackendStatus
}

const STORAGE_KEY = 'blueberry:selected_backend_url'

export const useMainStore = defineStore('mainStore', () => {
  // Rehydrate from localStorage on first load
  const persistedUrl = localStorage.getItem(STORAGE_KEY) ?? ''

  const backends = [
    { title: 'Express', url: 'http://localhost:8100' },
    { title: 'Fast API', url: 'http://localhost:8000' },
  ]

  const backend = ref<SelectedBackend>({
    title: backends.find((b) => b.url === persistedUrl)?.title ?? '',
    url: persistedUrl,
    status: 'unknown',
  })

  const showSideMenu = ref<boolean>(false)

  async function checkBackendHealth(url: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(`${url}/health`, { signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) {
        const data = (await res.json()) as { status: string }
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
      status: isAlive ? 'online' : 'offline',
    }
    // Persist so selection survives page reloads
    localStorage.setItem(STORAGE_KEY, url)
  }

  const toggleSideMenu = () => {
    showSideMenu.value = !showSideMenu.value
  }

  return { backend, backends, showSideMenu, selectBackend, checkBackendHealth, toggleSideMenu }
})
