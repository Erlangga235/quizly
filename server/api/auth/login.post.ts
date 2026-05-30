import { serverSupabaseServiceRole } from '#supabase/server'
import { createHash } from 'node:crypto'
import { signSession } from '~/server/utils/session'

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username dan password wajib diisi.' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: admin } = await supabase
    .from('admins')
    .select('id, username, password_hash')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (!admin) {
    throw createError({ statusCode: 401, statusMessage: 'Username atau password salah.' })
  }

  const [salt, storedHash] = (admin as any).password_hash.split(':')
  const inputHash = createHash('sha256').update(password + salt).digest('hex')

  if (inputHash !== storedHash) {
    throw createError({ statusCode: 401, statusMessage: 'Username atau password salah.' })
  }

  const authSecret = useRuntimeConfig(event).authSecret
  const token = signSession(
    { sub: (admin as any).id, username: (admin as any).username },
    authSecret,
    TOKEN_TTL_SECONDS
  )

  return { token, id: (admin as any).id, username: (admin as any).username }
})
