import type { H3Event } from 'h3'
import { verifySession, type AdminSession } from './session'

export function requireAdmin(event: H3Event): AdminSession {
  const authSecret = useRuntimeConfig(event).authSecret
  if (!authSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Server auth not configured.' })
  }
  const header = getRequestHeader(event, 'authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Tidak terautentikasi.' })
  }
  try {
    return verifySession(match[1], authSecret)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Sesi tidak valid atau kedaluwarsa.' })
  }
}
