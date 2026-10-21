import { describe, it, expect, vi } from 'vitest'
import { logger } from '../logger'

describe('logger service', () => {
  it('calls console.error when invoked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('test error')
    expect(spy).toHaveBeenCalledWith('test error')
    spy.mockRestore()
  })

  it('calls console.warn when invoked', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('test warn')
    expect(spy).toHaveBeenCalledWith('test warn')
    spy.mockRestore()
  })

  it('calls console.log when invoked', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.log('test log')
    expect(spy).toHaveBeenCalledWith('test log')
    spy.mockRestore()
  })
})
