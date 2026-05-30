import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, code, is_leaderboard_visible')
    .eq('id', quizId)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data: leaderboard } = await supabase
    .from('participants')
    .select('id, name, score, finished_at')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
    .limit(10)

  return { quiz, leaderboard: leaderboard || [] }
})
