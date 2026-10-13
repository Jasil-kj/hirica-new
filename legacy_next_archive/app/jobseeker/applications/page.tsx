import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, ChevronRight, CheckCircle2, Clock, Award, AlertCircle } from 'lucide-react'
import { ProjectSubmitter } from '@/components/projects/ProjectSubmitter'

export default async function JobseekerApplicationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  const { data: applications } = await adminSupabase
    .from('applications')
    .select(`
        *,
        job:job_id (
            title,
            location
        ),
        candidate_stage_instances (
            id,
            status,
            workflow_stages (
                name,
                stage_type
            ),
            candidate_assessments (
                id,
                assessment_sessions (
                    status,
                    assessment_results (
                        total_score
                    )
                )
            )
        )
    `)
    .eq('candidate_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Track your recruitment pipeline stages and assessment invites live.</p>
        </div>

        {(!applications || applications.length === 0) ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No applications submitted yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Explore open positions on Hirica and submit your candidate application today.</p>
                <Link 
                    href="/jobseeker/jobs" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all inline-block"
                >
                    Browse Open Jobs →
                </Link>
            </div>
        ) : (
            <div className="space-y-6">
                {applications.map((app: any) => {
                    const title = (app.job as any)?.title || 'Job Title'
                    const location = (app.job as any)?.location || 'Remote'

                    let activeAssessmentId = null
                    let activeStageName = 'Applied'
                    let completedResult = null
                    
                    let isProject = false
                    let projectInstanceId = null
                    let projectStatus = ''
                    
                    if (app.candidate_stage_instances && app.candidate_stage_instances.length > 0) {
                        const activeInstance = app.candidate_stage_instances.find((i:any) => i.status === 'in_progress' || i.status === 'in_review') || app.candidate_stage_instances[app.candidate_stage_instances.length - 1]
                        if (activeInstance) {
                            activeStageName = activeInstance.workflow_stages?.name || 'In Progress'
                            if (activeInstance.workflow_stages?.stage_type === 'assessment' && activeInstance.candidate_assessments?.[0]) {
                                const ca = activeInstance.candidate_assessments[0]
                                const session = ca.assessment_sessions?.[0]
                                if (session && session.status === 'completed') {
                                    completedResult = session.assessment_results?.[0]
                                } else {
                                    activeAssessmentId = ca.id
                                }
                            } else if (activeInstance.workflow_stages?.stage_type === 'project') {
                                isProject = true
                                projectInstanceId = activeInstance.id
                                projectStatus = activeInstance.status
                            }
                        }
                    }

                    return (
                        <div key={app.id} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col space-y-6 hover:shadow-md transition-all">
                            {/* Top Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl shrink-0 border border-blue-100">
                                        {title.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-xl text-gray-900">{title}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{location} • Applied {new Date(app.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 self-start md:self-auto">
                                    <span className={`text-xs font-black uppercase px-4 py-1.5 rounded-full border
                                        ${app.status === 'hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                        app.status === 'on_hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-blue-50 text-blue-700 border-blue-200'}
                                    `}>
                                        {app.status || 'Applied'}
                                    </span>
                                </div>
                            </div>

                            {/* Candidate Pipeline Timeline */}
                            <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 flex items-center justify-between overflow-x-auto gap-4">
                                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Application Received</span>
                                </div>
                                <div className="h-0.5 w-12 bg-gray-200 shrink-0" />

                                <div className="flex items-center space-x-2 text-xs font-bold shrink-0">
                                    <span className={`w-2.5 h-2.5 rounded-full ${app.current_stage_id ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                    <span className={app.current_stage_id ? 'text-blue-600 font-extrabold' : 'text-gray-400'}>
                                      Current Stage: {activeStageName}
                                    </span>
                                </div>
                                <div className="h-0.5 w-12 bg-gray-200 shrink-0" />

                                <div className="flex items-center space-x-2 text-xs font-bold shrink-0">
                                    {app.status === 'hired' ? (
                                      <span className="text-emerald-600 flex items-center"><Award className="w-4 h-4 mr-1" /> Hired</span>
                                    ) : app.status === 'rejected' ? (
                                      <span className="text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> Decision Finalized</span>
                                    ) : (
                                      <span className="text-gray-400 flex items-center"><Clock className="w-4 h-4 mr-1" /> Final Decision</span>
                                    )}
                                </div>
                            </div>

                            {/* Stage Action Area */}
                            <div className="pt-2 flex justify-between items-center">
                                {isProject && projectStatus === 'in_progress' ? (
                                    <ProjectSubmitter instanceId={projectInstanceId} />
                                ) : completedResult ? (
                                    <div className="flex items-center space-x-3 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span>Assessment Score: {completedResult.total_score}</span>
                                    </div>
                                ) : activeAssessmentId ? (
                                    <form action={async () => {
                                        'use server'
                                        const { startAssessmentSession } = await import('@/app/actions/assessmentSession')
                                        await startAssessmentSession(activeAssessmentId)
                                    }}>
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center">
                                            Start Assessment Test <ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </form>
                                ) : (
                                    <span className="text-xs text-gray-500 italic">
                                      {app.status === 'hired' ? 'Congratulations on your new role!' : 'Awaiting recruiter review'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </div>
    </div>
  )
}
