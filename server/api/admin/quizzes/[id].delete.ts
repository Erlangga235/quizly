import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId)
    .eq('admin_id', session.sub)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus kuis.' })
  }
  return { ok: true }
})
