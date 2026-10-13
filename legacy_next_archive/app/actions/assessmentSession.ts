'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startAssessmentSession(candidateAssessmentId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if session already exists
  const { data: existing } = await supabase
    .from('assessment_sessions')
    .select('id')
    .eq('candidate_assessment_id', candidateAssessmentId)
    .single()

  if (existing) {
      redirect(`/jobseeker/assessments/${existing.id}`)
  }

  // Create new session
  const { data: session, error } = await supabase
    .from('assessment_sessions')
    .insert([{
        candidate_assessment_id: candidateAssessmentId,
        start_time: new Date().toISOString(),
        status: 'in_progress'
    }])
    .select()
    .single()
    
  if (error || !session) {
      console.error("Session creation error", error)
      return { error: 'Failed to start assessment.' }
  }

  redirect(`/jobseeker/assessments/${session.id}`)
}

export async function saveAnswer(sessionId: string, questionId: string, answerData: any) {
    const supabase = await createClient()

    // Find existing answer
    const { data: existing } = await supabase
        .from('answers')
        .select('id')
        .eq('session_id', sessionId)
        .eq('question_id', questionId)
        .single()
        
    if (existing) {
        await supabase
            .from('answers')
            .update({ content: answerData })
            .eq('id', existing.id)
    } else {
        await supabase
            .from('answers')
            .insert([{
                session_id: sessionId,
                question_id: questionId,
                content: answerData
            }])
    }
}

export async function submitAssessment(sessionId: string) {
    const supabase = await createClient()
    
    await supabase
        .from('assessment_sessions')
        .update({ 
            end_time: new Date().toISOString(),
            status: 'completed' 
        })
        .eq('id', sessionId)
        
    // Trigger auto-evaluation
    const { evaluateAssessment } = await import('@/app/actions/evaluation')
    await evaluateAssessment(sessionId)
        
    redirect('/jobseeker/applications')
}
