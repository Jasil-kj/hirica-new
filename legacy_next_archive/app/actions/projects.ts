'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Note: For this mock, we are just marking the stage as 'in_review'
// In a full production env with DB access, we would store the link in a project_submissions table.
export async function submitProject(instanceId: string, link: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('candidate_stage_instances')
    .update({ status: 'in_review' })
    .eq('id', instanceId)

  if (error) {
      console.error("Project submission error:", error)
      return { error: 'Failed to submit project' }
  }

  revalidatePath('/jobseeker/applications')
  return { success: true }
}

export async function evaluateProject(instanceId: string, applicationId: string, passed: boolean) {
    const supabase = await createClient()
  
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
  
    // VERIFY OWNERSHIP (Security Hardening)
    const { data: profile } = await supabase.from('recruiter_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return { error: 'Not a recruiter' }
    const { data: app } = await supabase.from('applications').select('jobs!inner(recruiter_id)').eq('id', applicationId).single()
    if ((app as unknown as { jobs: { recruiter_id: string } })?.jobs?.recruiter_id !== profile.id) return { error: 'Unauthorized' }
  
    // Update instance status
    const { error: instanceError } = await supabase
      .from('candidate_stage_instances')
      .update({ status: passed ? 'completed' : 'failed' })
      .eq('id', instanceId)
  
    if (instanceError) return { error: 'Failed to update project status' }
  
    // If failed, reject the application entirely
    if (!passed) {
        await supabase
          .from('applications')
          .update({ status: 'rejected' })
          .eq('id', applicationId)
    }
  
    revalidatePath(`/recruiter/jobs`)
    return { success: true }
}
