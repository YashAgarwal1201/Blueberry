import { describe, it, expect } from 'vitest'
import { getErrorMessage, getErrorStatus } from '../errorUtils'

describe('errorUtils', () => {
  describe('getErrorMessage', () => {
    it('returns error from axios response data', () => {
      const err = { response: { data: { error: 'Server error' } }, message: 'Network error' }
      expect(getErrorMessage(err)).toBe('Server error')
    })

    it('returns message from axios response data', () => {
      const err = { response: { data: { message: 'Not found' } }, message: 'Network error' }
      expect(getErrorMessage(err)).toBe('Not found')
    })

    it('returns top level message if no response data', () => {
      const err = { message: 'Network error' }
      expect(getErrorMessage(err)).toBe('Network error')
    })

    it('returns message from Error instance', () => {
      const err = new Error('Standard error')
      expect(getErrorMessage(err)).toBe('Standard error')
    })

    it('returns fallback for completely unknown errors', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred')
      expect(getErrorMessage(undefined, 'Custom fallback')).toBe('Custom fallback')
      expect(getErrorMessage(123)).toBe('An unexpected error occurred')
    })
  })

  describe('getErrorStatus', () => {
    it('returns status from axios error', () => {
      const err = { response: { status: 404 }, message: 'Error' }
      expect(getErrorStatus(err)).toBe(404)
    })

    it('returns undefined if no status is present', () => {
      const err = { message: 'Error' }
      expect(getErrorStatus(err)).toBeUndefined()
    })

    it('returns undefined for non-axios errors', () => {
      expect(getErrorStatus(null)).toBeUndefined()
      expect(getErrorStatus(new Error('Test'))).toBeUndefined()
    })
  })
})
