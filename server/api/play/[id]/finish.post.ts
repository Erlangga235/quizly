import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const quizId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const name = (body?.name || '').trim()
  const score = Number(body?.score) || 0
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nama wajib diisi.' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Confirm the quiz exists before inserting a participant for it.
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data, error } = await supabase
    .from('participants')
    .insert({
      quiz_id: quizId,
      name,
      score,
      finished_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan skor.' })
  }
  return data
})
