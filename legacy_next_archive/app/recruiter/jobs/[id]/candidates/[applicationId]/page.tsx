import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, User, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Mic, Briefcase, Calendar } from 'lucide-react'
import { CandidateActionHeader } from '@/components/recruiter/CandidateActionHeader'
import { InterviewEvaluator } from '@/components/interviews/InterviewEvaluator'
import { ProjectEvaluator } from '@/components/projects/ProjectEvaluator'

export default async function CandidateDetailsPage({ params }: { params: { id: string, applicationId: string } }) {
  const { id, applicationId } = await Promise.resolve(params);

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // Fetch application, candidate, and stages/assessments with admin client
  const { data: app } = await adminSupabase
    .from('applications')
    .select(`
        *,
        candidate:candidate_id (
            full_name,
            email,
            job_seeker_profiles (
                bio,
                skills
            )
        ),
        candidate_stage_instances (
            id,
            status,
            workflow_stages (
                id,
                name,
                stage_type,
                order_index
            ),
            candidate_assessments (
                assessment_sessions (
                    id,
                    status,
                    assessment_results (
                        total_score,
                        trust_score,
                        ai_analysis
                    )
                )
            )
        ),
        jobs (
            title,
            hiring_workflows (
                workflow_stages (
                    id,
                    name,
                    stage_type,
                    order_index
                )
            )
        )
    `)
    .eq('id', applicationId)
    .maybeSingle()

  if (!app) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
        <Link href={`/recruiter/jobs/${id}`} className="text-sm font-bold text-blue-600 hover:underline">
          ← Back to Candidates List
        </Link>
      </div>
    )
  }

  const stages = app.jobs?.hiring_workflows?.[0]?.workflow_stages?.sort((a: any, b: any) => a.order_index - b.order_index) || []
  
  const getNextStage = (currentStageId: string | null) => {
      if (!currentStageId) return stages[0] || null
      const currentIndex = stages.findIndex((s: any) => s.id === currentStageId)
      if (currentIndex >= 0 && currentIndex < stages.length - 1) {
          return stages[currentIndex + 1]
      }
      return null
  }
  
  const nextStage = getNextStage(app.current_stage_id)
  const currentStageName = stages.find((s: any) => s.id === app.current_stage_id)?.name || 'Applied'

  return (
    <div className="min-h-screen bg-gray-50 p-8 pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="mb-4">
            <Link href={`/recruiter/jobs/${id}`} className="text-sm font-bold text-blue-600 flex items-center hover:underline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidate List
            </Link>
        </div>

        {/* Candidate Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center mb-6 md:mb-0">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mr-6 shrink-0 border border-blue-100">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl font-black text-gray-900">{app.candidate?.full_name || 'Candidate Name'}</h1>
                      <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full
                          ${app.status === 'hired' ? 'bg-emerald-100 text-emerald-700' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          app.status === 'on_hold' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                      `}>
                        {app.status || 'applied'}
                      </span>
                    </div>
                    <p className="text-gray-500 font-medium text-sm mt-1">{app.candidate?.email}</p>
                    
                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1" /> {app.jobs?.title || 'Job Role'}</span>
                      <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Applied {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Stage</p>
              <span className="text-sm font-black bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 inline-block">
                {currentStageName}
              </span>
            </div>
        </div>

        {/* Recruiter Action Bar */}
        <CandidateActionHeader 
          applicationId={app.id} 
          currentStatus={app.status || 'applied'} 
          nextStage={nextStage ? { id: nextStage.id, name: nextStage.name } : null} 
        />

        {/* Visual Hiring Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Hiring Pipeline Progress</h3>
          <div className="flex items-center overflow-x-auto pb-4 gap-4">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                ✓
              </div>
              <div>
                <p className="font-bold text-xs text-gray-900">Application</p>
                <p className="text-[10px] text-gray-400">Submitted</p>
              </div>
            </div>

            {stages.map((st: any, idx: number) => {
              const isCurrent = st.id === app.current_stage_id
              const isCompleted = stages.findIndex((s: any) => s.id === app.current_stage_id) > idx || app.status === 'hired'
              
              return (
                <div key={st.id} className="flex items-center space-x-4 shrink-0">
                  <div className="h-0.5 w-8 bg-gray-200" />
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs
                      ${isCompleted ? 'bg-emerald-100 text-emerald-700' :
                        isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' :
                        'bg-gray-100 text-gray-400'}
                    `}>
                      {isCompleted ? '✓' : idx + 2}
                    </div>
                    <div>
                      <p className={`font-bold text-xs ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>{st.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{st.stage_type}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stage History & Results */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Evaluation Reports & Stage Details</h2>
            
            {app.candidate_stage_instances && app.candidate_stage_instances.length > 0 ? (
              app.candidate_stage_instances.map((instance: any) => {
                const isAssessment = instance.workflow_stages?.stage_type === 'assessment'
                const isInterview = instance.workflow_stages?.stage_type === 'interview'
                
                const session = instance.candidate_assessments?.[0]?.assessment_sessions?.[0]
                const result = session?.assessment_results?.[0]
                
                return (
                    <div key={instance.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center">
                                {isInterview ? <Mic className="w-5 h-5 text-purple-500 mr-3" /> : <FileText className="w-5 h-5 text-blue-500 mr-3" />}
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{instance.workflow_stages?.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{instance.status?.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>

                        {isAssessment && (
                            <div className="p-6">
                                {!session ? (
                                    <p className="text-gray-500 italic text-sm">Assessment not started by candidate yet.</p>
                                ) : session.status === 'in_progress' ? (
                                    <p className="text-blue-600 font-medium text-sm">Assessment currently in progress...</p>
                                ) : result ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Score Card */}
                                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-500 mb-1">Assessment Score</p>
                                                    <div className="text-4xl font-black text-gray-900">{result.total_score}</div>
                                                </div>
                                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                            </div>

                                            {/* Trust Score Card */}
                                            <div className={`rounded-xl p-6 border flex items-center justify-between
                                                ${(result.trust_score || 100) >= 90 ? 'bg-emerald-50 border-emerald-100' : 
                                                (result.trust_score || 100) >= 70 ? 'bg-amber-50 border-amber-100' : 
                                                'bg-red-50 border-red-100'}
                                            `}>
                                                <div>
                                                    <p className="text-sm font-bold mb-1 opacity-70">Proctoring Trust Score</p>
                                                    <div className={`text-4xl font-black
                                                        ${(result.trust_score || 100) >= 90 ? 'text-emerald-700' : 
                                                        (result.trust_score || 100) >= 70 ? 'text-amber-700' : 'text-red-700'}
                                                    `}>{result.trust_score || 100}%</div>
                                                </div>
                                                <div>
                                                    {(result.trust_score || 100) >= 90 ? <ShieldCheck className="w-10 h-10 text-emerald-500" /> : 
                                                     (result.trust_score || 100) >= 70 ? <AlertTriangle className="w-10 h-10 text-amber-500" /> : 
                                                     <ShieldAlert className="w-10 h-10 text-red-500" />}
                                                </div>
                                            </div>
                                        </div>

                                        {result.ai_analysis && (
                                          <div>
                                              <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider text-gray-500">AI Detailed Analysis</h4>
                                              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{result.ai_analysis}</p>
                                              </div>
                                          </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-sm">Evaluation pending...</p>
                                )}
                            </div>
                        )}
                        
                        {isInterview && instance.status === 'in_progress' && (
                            <div className="p-6">
                                <InterviewEvaluator instanceId={instance.id} applicationId={app.id} stageName={instance.workflow_stages?.name} />
                            </div>
                        )}
                        
                        {isInterview && instance.status === 'completed' && (
                            <div className="p-6">
                                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center">
                                    <CheckCircle2 className="w-5 h-5 mr-3" />
                                    <span className="font-bold">Interview Passed & Approved</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Project Stage Logic */}
                        {instance.workflow_stages?.stage_type === 'project' && instance.status === 'in_review' && (
                            <div className="p-6">
                                <ProjectEvaluator instanceId={instance.id} applicationId={app.id} stageName={instance.workflow_stages?.name} />
                            </div>
                        )}
                    </div>
                )
              })
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-500">
                Candidate is currently at initial application review. Use the control bar above to advance them to the next stage!
              </div>
            )}
        </div>

      </div>
    </div>
  )
}
