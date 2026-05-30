import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('admin_id', session.sub)
    .single()

  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', quizId)
    .order('created_at')

  return { quiz, questions: questions || [] }
})
