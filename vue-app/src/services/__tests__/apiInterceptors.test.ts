import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import apiClient, { startBackendMonitoring, stopBackendMonitoring, getBackendStatus } from '../apiInterceptors'
import axios from 'axios'

vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      get: vi.fn()
    }
  }
})

describe('apiInterceptors', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    stopBackendMonitoring()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes backend status as true', () => {
    expect(getBackendStatus()).toBe(true)
  })


  it('monitoring updates status based on health check', async () => {
    startBackendMonitoring()
    
    // Default online
    expect(getBackendStatus()).toBe(true)
    
    // Simulate failing health check
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'))
    
    // Advance timers by 20000ms (the interval)
    await vi.advanceTimersByTimeAsync(20000)
    
    expect(axios.get).toHaveBeenCalled()
    expect(getBackendStatus()).toBe(false)
    
    // Simulate successful health check
    vi.mocked(axios.get).mockResolvedValueOnce({ data: 'ok' } as any)
    
    await vi.advanceTimersByTimeAsync(20000)
    
    expect(getBackendStatus()).toBe(true)
  })

  it('stops monitoring', () => {
    startBackendMonitoring()
    stopBackendMonitoring()
    
    vi.advanceTimersByTime(20000)
    
    // Assuming mock is cleared, if it didn't run, get won't be called
    expect(axios.get).not.toHaveBeenCalled()
  })
})
