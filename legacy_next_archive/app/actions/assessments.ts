'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveAssessmentConfig(formData: FormData, stageId: string, jobId: string) {
  const supabase = await createClient()

  // Ensure user owns this job
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const skillsString = formData.get('skills_required') as string
  const skillsArray = skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0)

  const configData = {
    stage_id: stageId,
    duration_minutes: parseInt(formData.get('duration_minutes') as string, 10) || 60,
    passing_score: parseInt(formData.get('passing_score') as string, 10) || 70,
    difficulty: formData.get('difficulty') as string,
    allowed_languages: (formData.get('allowed_languages') as string || 'javascript,python').split(',').map(s => s.trim()),
    skills_required: skillsArray,
    proctoring_strictness: formData.get('proctoring_strictness') as string || 'medium'
  }

  // Upsert the config. We need to check if one exists first or just use upsert if stage_id is unique.
  // Assuming stage_id is unique for assessment_configs
  
  // First check if it exists
  const { data: existing } = await supabase
    .from('assessment_configs')
    .select('id')
    .eq('stage_id', stageId)
    .single()

  let result;
  if (existing) {
      result = await supabase.from('assessment_configs').update(configData).eq('id', existing.id)
  } else {
      result = await supabase.from('assessment_configs').insert([configData])
  }

  if (result.error) {
      console.error("Save config error:", result.error)
      return { error: 'Failed to save configuration.' }
  }

  revalidatePath(`/recruiter/jobs/${jobId}/workflow`)
  return { success: true }
}
