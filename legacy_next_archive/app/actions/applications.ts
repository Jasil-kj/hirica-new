'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function applyForJob(jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // Check if already applied
  const { data: existingApp } = await adminSupabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('candidate_id', user.id)
    .maybeSingle()

  if (existingApp) {
      return { error: 'You have already applied for this job.' }
  }

  const applicationData = {
    job_id: jobId,
    candidate_id: user.id,
    status: 'applied',
  }

  const { data, error } = await adminSupabase
    .from('applications')
    .insert([applicationData])
    .select()

  if (error) {
    console.error("Application error:", error)
    return { error: `Failed: ${error.message}` }
  }

  revalidatePath('/jobseeker/applications')
  revalidatePath(`/jobseeker/jobs/${jobId}`)
  return { success: true }
}
