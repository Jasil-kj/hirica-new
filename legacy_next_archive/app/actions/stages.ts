'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function advanceCandidateStage(applicationId: string, stageId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // 1. Create a candidate stage instance using adminSupabase
  const { data: csi, error: csiError } = await adminSupabase
    .from('candidate_stage_instances')
    .insert([{
        application_id: applicationId,
        stage_id: stageId,
        status: 'in_progress'
    }])
    .select()
    .single()

  if (csiError || !csi) {
      console.error("Error creating candidate stage instance:", csiError)
      return { error: `Failed to advance candidate: ${csiError?.message}` }
  }

  // 2. Check stage details
  const { data: stage } = await adminSupabase.from('workflow_stages').select('name, stage_type').eq('id', stageId).maybeSingle()
  
  if (stage?.name) {
    // Notify the candidate
    const { data: candidateInfo } = await adminSupabase
        .from('applications')
        .select('candidate_id')
        .eq('id', applicationId)
        .maybeSingle()
        
    if (candidateInfo?.candidate_id) {
        const { createNotification } = await import('@/app/actions/notifications')
        await createNotification(
            candidateInfo.candidate_id, 
            'Application Update', 
            `You have been advanced to stage: ${stage.name}. Please check your candidate portal.`
        )
    }
  }
  
  if (stage?.stage_type === 'assessment') {
      // Find latest assessment version
      const { data: version } = await adminSupabase
        .from('assessment_versions')
        .select('id')
        .eq('stage_id', stageId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (version) {
          const { data: questions } = await adminSupabase
            .from('questions')
            .select('id')
            .eq('assessment_version_id', version.id)
            
          const questionIds = questions?.map(q => q.id) || []
          
          await adminSupabase.from('candidate_assessments').insert([{
              stage_instance_id: csi.id,
              assessment_version_id: version.id,
              question_ids: questionIds
          }])
      }
  }

  // Update application status to in_progress and current_stage_id
  await adminSupabase.from('applications').update({ status: 'in_progress', current_stage_id: stageId }).eq('id', applicationId)

  revalidatePath('/recruiter/jobs')
  revalidatePath('/jobseeker/applications')
  return { success: true }
}

export async function updateApplicationStatus(applicationId: string, status: 'hired' | 'rejected' | 'on_hold' | 'retry_requested', note?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    return { error: `Failed to update status: ${error.message}` }
  }

  // Get candidate ID to send notification
  const { data: app } = await adminSupabase
    .from('applications')
    .select('candidate_id, job:jobs(title)')
    .eq('id', applicationId)
    .maybeSingle()

  if (app?.candidate_id) {
    const jobTitle = (app.job as any)?.title || 'the position'
    const statusTitles: Record<string, string> = {
      hired: '🎉 Congratulations! Offer Received',
      rejected: 'Application Status Update',
      on_hold: 'Application On Hold',
      retry_requested: 'Assessment Retry Requested'
    }
    const statusMsgs: Record<string, string> = {
      hired: `You have been officially HIRED for ${jobTitle}! The recruiter will be in touch with your formal offer.`,
      rejected: `Thank you for your interest in ${jobTitle}. At this time, the recruiter has decided to proceed with other candidates.`,
      on_hold: `Your application for ${jobTitle} has been placed on hold. We will notify you if a decision is made.`,
      retry_requested: `Your request to retry the assessment for ${jobTitle} has been submitted.`
    }

    const { createNotification } = await import('@/app/actions/notifications')
    await createNotification(
      app.candidate_id,
      statusTitles[status] || 'Application Update',
      statusMsgs[status] || `Your application status for ${jobTitle} was updated to ${status}.`
    )
  }

  revalidatePath('/recruiter/jobs')
  revalidatePath('/jobseeker/applications')
  return { success: true }
}
