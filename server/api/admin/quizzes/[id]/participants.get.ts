import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  // Confirm the quiz belongs to this admin before exposing participants.
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('admin_id', session.sub)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data } = await supabase
    .from('participants')
    .select('*')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })

  return data || []
})
