// src/composables/useBackendMonitor.ts
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import toastHandler from '@/composables/toastHandeler'

const isMonitoring = ref(false)
let checkInterval: ReturnType<typeof setInterval> | null = null

export function useBackendMonitor() {

  const router = useRouter()
  const { showToast } = toastHandler()

  const startMonitoring = () => {
    // Prevent multiple monitors
    if (isMonitoring.value) return

    isMonitoring.value = true

    checkInterval = setInterval(async () => {
      const isAlive = true
      if (!isAlive) {
        showToast('error', 'Disconnected', 'Backend went offline. Redirecting home...')
        stopMonitoring()
        router.push('/')
      }
    }, 10000) // Check every 10s
  }

  const stopMonitoring = () => {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
    isMonitoring.value = false
  }

  // Cleanup when component unmounts
  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    startMonitoring,
    stopMonitoring,
    isMonitoring,
  }
}
