import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder'

export default async function JobWorkflowPage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // 1. Fetch job directly with admin client
  const { data: job } = await adminSupabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!job) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
        <p className="text-gray-500 mb-6">The requested job ID ({id}) could not be located in your database.</p>
        <Link href="/recruiter/jobs" className="text-sm font-bold text-blue-600 hover:underline">
          ← Back to Jobs List
        </Link>
      </div>
    )
  }

  // 2. Fetch or create workflow
  let { data: workflow } = await adminSupabase
    .from('hiring_workflows')
    .select('*')
    .eq('job_id', id)
    .maybeSingle()

  if (!workflow) {
    // Auto-create workflow if missing (without non-existent columns)
    const { data: newWf } = await adminSupabase
      .from('hiring_workflows')
      .insert([{ job_id: id }])
      .select()
      .maybeSingle()
    workflow = newWf
  }

  const targetWorkflowId = workflow?.id || id

  // 3. Fetch stages (support workflow_id or job_id schema)
  let { data: stages } = await adminSupabase
    .from('workflow_stages')
    .select('*')
    .eq('workflow_id', targetWorkflowId)

  if (!stages || stages.length === 0) {
    const { data: fallbackStages } = await adminSupabase
      .from('workflow_stages')
      .select('*')
      .eq('job_id', id)
    stages = fallbackStages
  }

  if (!stages || stages.length === 0) {
    // Default initial stages
    stages = [
      { name: 'Application Review', stage_type: 'application' },
      { name: 'AI Assessment', stage_type: 'assessment' }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <Link href="/recruiter/jobs" className="text-sm font-bold text-blue-600 flex items-center hover:underline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
            </Link>
        </div>
        
        <div className="mb-6">
            <h1 className="text-3xl font-black text-gray-900">Pipeline: {job.title}</h1>
            <p className="text-sm text-gray-500">{job.location || 'Remote'} • Published</p>
        </div>

        <WorkflowBuilder workflowId={targetWorkflowId} initialStages={stages || []} jobId={id} />
      </div>
    </div>
  )
}
