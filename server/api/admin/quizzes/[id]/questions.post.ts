import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const text = (body?.text || '').trim()
  const timeLimit = Number(body?.time_limit) || 30
  const options = Array.isArray(body?.options) ? body.options : []
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Teks pertanyaan wajib diisi.' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Ownership check via parent quiz.
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('admin_id', session.sub)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .insert({ quiz_id: quizId, text, time_limit: timeLimit })
    .select()
    .single()
  if (qErr || !question) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menambah pertanyaan.' })
  }

  const optsToInsert = options
    .filter((o: any) => o && typeof o.text === 'string' && o.text.trim())
    .map((o: any) => ({
      question_id: question.id,
      text: o.text.trim(),
      is_correct: !!o.is_correct,
    }))

  if (optsToInsert.length > 0) {
    const { error: oErr } = await supabase.from('options').insert(optsToInsert)
    if (oErr) {
      throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan opsi.' })
    }
  }

  return { id: question.id }
})
