import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AssessmentRunner } from '@/components/assessments/AssessmentRunner'
import { ProctoringTracker } from '@/components/assessments/ProctoringTracker'

export default async function TakeAssessmentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await Promise.resolve(params);

  // Fetch Session and related data
  const { data: session } = await supabase
    .from('assessment_sessions')
    .select(`
        *,
        candidate_assessments (
            question_ids,
            candidate_stage_instances (
                workflow_stages (
                    assessment_configs (
                        duration_minutes,
                        proctoring_strictness
                    )
                )
            )
        )
    `)
    .eq('id', id)
    .single()

  if (!session) return <div>Session not found.</div>
  
  if (session.status === 'completed') {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-green-600 text-2xl">✓</span>
                  </div>
                  <h1 className="text-2xl font-bold text-black mb-2">Assessment Completed</h1>
                  <p className="text-gray-500 mb-6">Your responses have been saved and submitted for review.</p>
                  <a href="/jobseeker/applications" className="bg-brand-black text-white px-6 py-3 rounded-xl font-bold inline-block">Return to Dashboard</a>
              </div>
          </div>
      )
  }

  // Fetch the actual questions
  const questionIds = (session.candidate_assessments as any)?.question_ids || []
  
  const { data: questions } = await supabase
    .from('questions')
    .select(`
        id,
        content,
        question_type,
        points,
        question_options (
            id,
            content
        )
    `)
    .in('id', questionIds)

  const config = (session.candidate_assessments as any)?.candidate_stage_instances?.workflow_stages?.assessment_configs?.[0]
  const duration = config?.duration_minutes || 60
  const strictness = config?.proctoring_strictness || 'medium'

  return (
      <>
        <ProctoringTracker sessionId={session.id} strictness={strictness} />
        <AssessmentRunner sessionId={session.id} questions={questions || []} durationMinutes={duration} startTime={session.start_time} />
      </>
  )
}
