import { createHmac, timingSafeEqual } from 'node:crypto'

export interface AdminSession {
  sub: string       // admin id
  username: string
  iat: number       // issued-at (seconds)
  exp: number       // expiry (seconds)
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

export function signSession(
  claims: { sub: string; username: string },
  secret: string,
  ttlSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSession = {
    sub: claims.sub,
    username: claims.username,
    iat: now,
    exp: now + ttlSeconds,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(encoded, secret)
  return `${encoded}.${signature}`
}

export function verifySession(token: string, secret: string): AdminSession {
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Malformed token')
  }
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) {
    throw new Error('Malformed token')
  }
  const expected = sign(encoded, secret)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Invalid signature')
  }
  let payload: AdminSession
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    throw new Error('Invalid payload')
  }
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp !== 'number' || payload.exp < now) {
    throw new Error('Token expired')
  }
  return payload
}
