import { describe, it, expect, vi, beforeEach } from 'vitest'
import toastHandler from '../toastHandler'

const mockAdd = vi.fn()
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockAdd,
  }),
}))

describe('toastHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates showToast to primevue useToast.add', () => {
    const { showToast } = toastHandler()
    showToast('success', 'Success Title', 'Success Detail', 3000)

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success Title',
      detail: 'Success Detail',
      life: 3000,
    })
  })

  it('uses default life of 2000ms when not specified', () => {
    const { showToast } = toastHandler()
    showToast('error', 'Error Title', 'Error Detail')

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error Title',
      detail: 'Error Detail',
      life: 2000,
    })
  })
})
