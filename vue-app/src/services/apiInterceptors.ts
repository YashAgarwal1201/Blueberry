import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useMainStore } from '@/stores/mainStore'

const apiClient = axios.create({
  timeout: 10000,
})

let isBackendOnline = true
let monitoringInterval: ReturnType<typeof setInterval> | null = null

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const mainStore = useMainStore()
  if (mainStore.backend.url) {
    config.baseURL = mainStore.backend.url
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    if (!isBackendOnline) {
      isBackendOnline = true
    }
    return response
  },
  (error) => {
    if (!error.response) {
      isBackendOnline = false
    }
    return Promise.reject(error)
  },
)

export function startBackendMonitoring() {
  if (monitoringInterval) return

  monitoringInterval = setInterval(async () => {
    const mainStore = useMainStore()
    if (!mainStore.backend.url) return

    try {
      await axios.get(`${mainStore.backend.url}/health`, { timeout: 3000 })
      if (!isBackendOnline) {
        isBackendOnline = true
      }
    } catch {
      if (isBackendOnline) {
        isBackendOnline = false
      }
    }
  }, 20000)
}

export function stopBackendMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
}

export function getBackendStatus(): boolean {
  return isBackendOnline
}

export default apiClient
