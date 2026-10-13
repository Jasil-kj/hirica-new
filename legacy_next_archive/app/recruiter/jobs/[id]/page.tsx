import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Users, ChevronRight, Play } from 'lucide-react'
import { AdvanceCandidateButton } from '@/components/jobs/AdvanceCandidateButton'

export default async function RecruiterJobDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await Promise.resolve(params);

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // Fetch Job & Applications
  const { data: job } = await adminSupabase
    .from('jobs')
    .select(`
        *,
        applications (
            id,
            status,
            created_at,
            candidate:candidate_id (
                full_name,
                email
            ),
            current_stage_id
        ),
        hiring_workflows (
            id,
            workflow_stages (
                id,
                name,
                order_index,
                stage_type
            )
        )
    `)
    .eq('id', id)
    .single()

  if (!job) return <div>Job not found.</div>

  const stages = job.hiring_workflows?.[0]?.workflow_stages?.sort((a:any, b:any) => a.order_index - b.order_index) || []
  
  // Helper to find the next stage for a candidate
  const getNextStage = (currentStageId: string | null) => {
      if (!currentStageId) return stages[0]
      const currentIndex = stages.findIndex((s:any) => s.id === currentStageId)
      if (currentIndex >= 0 && currentIndex < stages.length - 1) {
          return stages[currentIndex + 1]
      }
      return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
            <Link href="/recruiter/jobs" className="text-sm font-bold text-brand-blue flex items-center hover:underline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
            </Link>
        </div>
        
        <div className="flex justify-between items-end mb-10">
            <div>
                <h1 className="text-3xl font-black text-black">{job.title}</h1>
                <p className="text-gray-500">{job.location} • {job.employment_type}</p>
            </div>
            <Link href={`/recruiter/jobs/${job.id}/workflow`} className="bg-white border border-gray-200 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                Edit Pipeline
            </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-black flex items-center mb-6">
                <Users className="w-5 h-5 mr-2 text-brand-blue" /> Candidates ({job.applications?.length || 0})
            </h2>

            {(!job.applications || job.applications.length === 0) ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No candidates have applied yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {job.applications.map((app: any) => {
                        const nextStage = getNextStage(app.current_stage_id)
                        const currentStageName = stages.find((s:any) => s.id === app.current_stage_id)?.name || 'Applied'
                        
                        return (
                            <Link href={`/recruiter/jobs/${job.id}/candidates/${app.id}`} key={app.id} className="block">
                                <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-all hover:shadow-sm">
                                    <div>
                                        <p className="font-bold text-black text-lg group-hover:text-brand-blue">{app.candidate?.full_name}</p>
                                        <p className="text-sm text-gray-500">{app.candidate?.email}</p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Current Stage</p>
                                            <span className="text-xs font-bold bg-blue-50 text-brand-blue px-3 py-1 rounded-full">{currentStageName}</span>
                                        </div>
                                        
                                        <div onClick={(e) => e.preventDefault()}>
                                            {nextStage ? (
                                                <AdvanceCandidateButton applicationId={app.id} stageId={nextStage.id} stageName={nextStage.name} />
                                            ) : (
                                                <span className="text-sm font-bold text-green-500">Pipeline Complete</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
