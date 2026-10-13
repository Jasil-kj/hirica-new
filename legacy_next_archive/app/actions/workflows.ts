'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateWorkflowStages(workflowIdOrJobId: string, stages: any[]) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // 1. Try to find workflow by ID or by job_id
  let { data: workflow } = await adminSupabase
    .from('hiring_workflows')
    .select('id, job_id')
    .eq('id', workflowIdOrJobId)
    .maybeSingle()

  if (!workflow) {
    const { data: wfByJob } = await adminSupabase
      .from('hiring_workflows')
      .select('id, job_id')
      .eq('job_id', workflowIdOrJobId)
      .maybeSingle()
    
    workflow = wfByJob
  }

  if (!workflow) {
    const { data: job } = await adminSupabase
      .from('jobs')
      .select('id')
      .eq('id', workflowIdOrJobId)
      .maybeSingle()

    if (job) {
      const { data: newWf } = await adminSupabase
        .from('hiring_workflows')
        .insert([{ job_id: job.id }])
        .select('id, job_id')
        .maybeSingle()

      workflow = newWf
    }
  }

  const targetWorkflowId = workflow?.id || workflowIdOrJobId
  const targetJobId = workflow?.job_id || workflowIdOrJobId

  // 2. Clear existing stages
  await adminSupabase.from('workflow_stages').delete().eq('workflow_id', targetWorkflowId)
  await adminSupabase.from('workflow_stages').delete().eq('job_id', targetJobId)

  // Normalization for Migration 0004 schema: CHECK ('assessment', 'technical_interview', 'hr_interview', 'ai_technical_interview', 'ai_hr_interview', 'recruiter_interview', 'project_assignment', 'final_review', 'custom')
  const normalizeForMigration0004 = (type: string) => {
    const t = (type || '').toLowerCase()
    if (t === 'interview') return 'technical_interview'
    if (t === 'project') return 'project_assignment'
    if (t === 'application') return 'custom'
    return t || 'assessment'
  }

  // Normalization for Manual Setup Guide schema: CHECK ('assessment', 'interview', 'project')
  const normalizeForManualSetup = (type: string) => {
    const t = (type || '').toLowerCase()
    if (t === 'technical_interview' || t === 'hr_interview' || t === 'ai_technical_interview') return 'interview'
    if (t === 'project_assignment') return 'project'
    if (t === 'application' || t === 'custom') return 'assessment'
    return t || 'assessment'
  }

  // Attempt 1: Migration 0004 schema (workflow_id, name, order_index)
  const attempt1 = stages.map((s, idx) => ({
      workflow_id: targetWorkflowId,
      name: s.name,
      stage_type: normalizeForMigration0004(s.stage_type),
      order_index: idx
  }))
  let res1 = await adminSupabase.from('workflow_stages').insert(attempt1)
  if (!res1.error) {
    revalidatePath(`/recruiter/jobs`)
    return { success: true }
  }

  // Attempt 2: Manual Setup Schema (job_id, name, stage_order)
  const attempt2 = stages.map((s, idx) => ({
      job_id: targetJobId,
      name: s.name,
      stage_type: normalizeForManualSetup(s.stage_type),
      stage_order: idx
  }))
  let res2 = await adminSupabase.from('workflow_stages').insert(attempt2)
  if (!res2.error) {
    revalidatePath(`/recruiter/jobs`)
    return { success: true }
  }

  // Attempt 3: Migration 0004 schema with stage_order
  const attempt3 = stages.map((s, idx) => ({
      workflow_id: targetWorkflowId,
      name: s.name,
      stage_type: normalizeForMigration0004(s.stage_type),
      stage_order: idx
  }))
  let res3 = await adminSupabase.from('workflow_stages').insert(attempt3)
  if (!res3.error) {
    revalidatePath(`/recruiter/jobs`)
    return { success: true }
  }

  // Attempt 4: Manual Setup Schema with order_index
  const attempt4 = stages.map((s, idx) => ({
      job_id: targetJobId,
      name: s.name,
      stage_type: normalizeForManualSetup(s.stage_type),
      order_index: idx
  }))
  let res4 = await adminSupabase.from('workflow_stages').insert(attempt4)
  if (!res4.error) {
    revalidatePath(`/recruiter/jobs`)
    return { success: true }
  }

  const lastErr = res1.error || res2.error || res3.error || res4.error
  console.error("All stage insert attempts failed:", lastErr)
  return { error: `Failed to save workflow stages: ${lastErr?.message || 'Database insert failed'}` }
}
