import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('quizzes')
    .select('*, questions(count), participants(count)')
    .eq('admin_id', session.sub)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal memuat kuis.' })
  }
  return data || []
})
