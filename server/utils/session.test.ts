import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from './session'

const SECRET = 'test-secret-please-change'

describe('session token', () => {
  it('round-trips a valid token', () => {
    const token = signSession({ sub: 'admin-1', username: 'alice' }, SECRET, 3600)
    const session = verifySession(token, SECRET)
    expect(session.sub).toBe('admin-1')
    expect(session.username).toBe('alice')
  })

  it('rejects a token signed with a different secret', () => {
    const token = signSession({ sub: 'admin-1', username: 'alice' }, SECRET, 3600)
    expect(() => verifySession(token, 'other-secret')).toThrow()
  })

  it('rejects a tampered payload', () => {
    const token = signSession({ sub: 'admin-1', username: 'alice' }, SECRET, 3600)
    const [, sig] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ sub: 'admin-999', username: 'evil', iat: 1, exp: 9999999999 })).toString('base64url')
    expect(() => verifySession(`${forged}.${sig}`, SECRET)).toThrow()
  })

  it('rejects an expired token', () => {
    const token = signSession({ sub: 'admin-1', username: 'alice' }, SECRET, -1)
    expect(() => verifySession(token, SECRET)).toThrow()
  })

  it('rejects a malformed token', () => {
    expect(() => verifySession('not-a-token', SECRET)).toThrow()
  })
})
