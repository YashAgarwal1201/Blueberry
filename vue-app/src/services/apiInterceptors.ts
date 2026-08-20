import axios, { type InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8100'

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
})

let isBackendOnline = true
let monitoringInterval: ReturnType<typeof setInterval> | null = null

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
    } else if (error.response.status === 401) {
      // If unauthorized, we could emit an event or redirect to login.
      // We will let the router guard handle strict protections, 
      // but for API calls that fail with 401, we might want to trigger a logout flow.
      if (window.location.pathname !== '/auth') {
         window.location.href = '/auth';
      }
    }
    return Promise.reject(error)
  },
)

export function startBackendMonitoring() {
  if (monitoringInterval) return

  monitoringInterval = setInterval(async () => {
    try {
      await axios.get(`${API_URL}/health`, { timeout: 3000 })
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
