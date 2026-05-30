import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const code = (body?.code || '').toUpperCase().trim()
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Kode wajib diisi.' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data } = await supabase
    .from('quizzes')
    .select('id')
    .eq('code', code)
    .single()

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }
  return { id: data.id }
})
