import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const body = await readBody(event)
  const title = (body?.title || '').trim()
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Judul kuis wajib diisi.' })
  }

  const insertData: Record<string, any> = {
    title,
    description: '',
    admin_id: session.sub,
  }
  const code = (body?.code || '').trim()
  if (code) {
    insertData.code = code.toUpperCase().slice(0, 4)
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await supabase
    .from('quizzes')
    .insert(insertData)
    .select()
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat kuis.' })
  }
  return data
})
