import { useToast } from 'primevue/usetoast'

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error'

const toastHandler = () => {
  let toast: ReturnType<typeof useToast> | null = null
  try {
    toast = useToast()
  } catch {
    toast = null
  }

  return {
    showToast: (
      severity: ToastSeverity,
      summary: string,
      detail: string,
      life: number = 2000,
    ): void => {
      toast?.add({ severity, summary, detail, life })
    },
  }
}

export default toastHandler
