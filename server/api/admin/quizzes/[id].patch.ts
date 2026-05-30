import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const updates: Record<string, any> = {}
  if (typeof body?.title === 'string' && body.title.trim()) {
    updates.title = body.title.trim()
  }
  if (typeof body?.is_leaderboard_visible === 'boolean') {
    updates.is_leaderboard_visible = body.is_leaderboard_visible
  }
  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada perubahan.' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await supabase
    .from('quizzes')
    .update(updates)
    .eq('id', quizId)
    .eq('admin_id', session.sub)
    .select()
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }
  return data
})
