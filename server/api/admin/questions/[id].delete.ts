import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const questionId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  // Resolve the question's quiz, then confirm that quiz is owned by this admin.
  const { data: question } = await supabase
    .from('questions')
    .select('id, quiz_id')
    .eq('id', questionId)
    .single()
  if (!question) {
    throw createError({ statusCode: 404, statusMessage: 'Pertanyaan tidak ditemukan.' })
  }

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', question.quiz_id)
    .eq('admin_id', session.sub)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 403, statusMessage: 'Bukan pemilik kuis ini.' })
  }

  const { error } = await supabase.from('questions').delete().eq('id', questionId)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus pertanyaan.' })
  }
  return { ok: true }
})
