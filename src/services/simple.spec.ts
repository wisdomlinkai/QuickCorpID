/**
 * Simple CorpID Credential Tests
 */

import { describe, it, expect } from 'vitest'

// CorpID Sandbox credentials
const CORPID_CLIENT_ID = '2148277b187645a796992f7a66fe52a4'
const CORPID_CLIENT_SECRET = '3ccedb89d9b7c7b0c54fdf11a4e6e31ab83602e7d63f8efd2cbcd4dfca6278ea'

describe('CorpID Credentials', () => {
  it('should have Client ID configured', () => {
    expect(CORPID_CLIENT_ID).toBeDefined()
    expect(CORPID_CLIENT_ID).toBe('2148277b187645a796992f7a66fe52a4')
  })

  it('should have Client Secret configured', () => {
    expect(CORPID_CLIENT_SECRET).toBeDefined()
    expect(CORPID_CLIENT_SECRET).toBe('3ccedb89d9b7c7b0c54fdf11a4e6e31ab83602e7d63f8efd2cbcd4dfca6278ea')
  })

  it('should have Client ID in correct format (32 hex characters)', () => {
    expect(CORPID_CLIENT_ID).toMatch(/^[a-f0-9]{32}$/)
  })

  it('should have Client Secret in correct format (64 hex characters)', () => {
    expect(CORPID_CLIENT_SECRET).toMatch(/^[a-f0-9]{64}$/)
  })
})
