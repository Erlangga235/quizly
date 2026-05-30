import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('questions')
    .select('id, quiz_id, text, time_limit, created_at, options(id, question_id, text)')
    .eq('quiz_id', quizId)
    .order('created_at')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal memuat soal.' })
  }
  return data || []
})
