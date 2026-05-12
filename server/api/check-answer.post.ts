import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { quiz_id, question_id, option_id, participant_name, time_left } = body

  if (!quiz_id || !question_id || !option_id) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak lengkap.' })
  }

  const supabase = await serverSupabaseClient(event)

  // Validate the selected option from the database
  const { data: option, error: optError } = await supabase
    .from('options')
    .select('id, is_correct, question_id')
    .eq('id', option_id)
    .eq('question_id', question_id)
    .single()

  if (optError || !option) {
    throw createError({ statusCode: 404, statusMessage: 'Opsi tidak ditemukan.' })
  }

  let scoreEarned = 0
  if (option.is_correct) {
    scoreEarned = 1000 + ((time_left || 0) * 10)
  }

  return {
    is_correct: option.is_correct,
    score_earned: scoreEarned
  }
})
