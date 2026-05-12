import { serverSupabaseClient } from '#supabase/server'
import { createHash, randomBytes } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username dan password wajib diisi.' })
  }

  if (username.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'Username minimal 3 karakter.' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password minimal 6 karakter.' })
  }

  const supabase = await serverSupabaseClient(event)

  // Check if username already exists
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Username sudah dipakai.' })
  }

  // Hash password with salt
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  const password_hash = `${salt}:${hash}`

  const { data, error } = await supabase
    .from('admins')
    .insert({ username: username.trim().toLowerCase(), password_hash })
    .select('id, username')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat akun.' })
  }

  return { id: (data as any).id, username: (data as any).username }
})
