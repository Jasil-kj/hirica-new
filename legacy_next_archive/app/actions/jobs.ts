'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function generateAIJobDescription(promptText: string, experienceLevel?: string, skills?: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) {
    return {
      success: true,
      title: promptText,
      description: `We are looking for an exceptional ${promptText} (${experienceLevel || 'Mid-Senior Level'}) to drive end-to-end engineering initiatives. You will work on scalable architecture, code optimization, and modern product engineering using tech stack: ${skills || 'React, Node.js, SQL'}.`,
      requirements: `• ${experienceLevel || '3+ years'} of hands-on software development experience.\n• High proficiency in ${skills || 'modern software stack'}.\n• Excellent problem-solving skills, system design understanding, and clean code practices.`
    }
  }

  try {
    const prompt = `
      Act as an Executive Recruiter for LinkedIn & Indeed.
      Generate a professional job description for role: "${promptText}".
      Target Experience Level: "${experienceLevel || 'Mid-Senior Level'}".
      Key Skills Required: "${skills || 'Software Engineering'}".

      Return JSON strictly:
      {
        "title": "${promptText}",
        "description": "Comprehensive role summary, key responsibilities, and team impact...",
        "requirements": "Bullet-point qualifications, technical skills, and educational requirements..."
      }
    `

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    })

    const data = await res.json()
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = textResult ? JSON.parse(textResult) : null

    if (parsed?.title) {
      return { success: true, title: parsed.title, description: parsed.description, requirements: parsed.requirements }
    }
  } catch (err) {
    console.error("AI job description generation failed:", err)
  }

  return {
    success: true,
    title: promptText,
    description: `We are seeking a talented ${promptText} (${experienceLevel || 'Mid-Senior'}) to join our core engineering team.`,
    requirements: `• Proficiency with ${skills || 'relevant frameworks'}.\n• Proven track record in building production applications.`
  }
}

export async function createJob(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  const { data: recProfile } = await adminSupabase
    .from('recruiter_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const recruiterProfileId = recProfile?.id || user.id

  const title = (formData.get('title') as string) || ''
  const department = (formData.get('department') as string) || 'Engineering'
  const workMode = (formData.get('workMode') as string) || 'Remote'
  const location = (formData.get('location') as string) || 'Remote'
  const employmentType = (formData.get('employmentType') as string) || 'Full-time'
  const experienceLevel = (formData.get('experienceLevel') as string) || 'Mid-Senior Level'
  const salaryRange = (formData.get('salaryRange') as string) || 'Competitive'
  const skills = (formData.get('skills') as string) || 'Software Engineering'
  const assessmentFocus = (formData.get('assessmentFocus') as string) || 'Balanced'
  const requirements = (formData.get('requirements') as string) || ''
  const rawDescription = (formData.get('description') as string) || ''

  // Format rich Indeed/LinkedIn specification block
  const fullDescriptionBlock = `
=== JOB METADATA & AI CALIBRATION SPECIFICATION ===
Role Title: ${title}
Department: ${department}
Work Mode: ${workMode}
Location: ${location}
Employment Type: ${employmentType}
Experience Level: ${experienceLevel}
Salary Range: ${salaryRange}
Key Technical Skills: ${skills}
AI Test Focus: ${assessmentFocus}

=== ROLE OVERVIEW & RESPONSIBILITIES ===
${rawDescription}

=== REQUIREMENTS & QUALIFICATIONS ===
${requirements}
`.trim()

  const jobData: Record<string, any> = {
    recruiter_id: recruiterProfileId,
    title: title,
    description: fullDescriptionBlock,
    status: 'published',
  }

  const { data, error } = await adminSupabase
    .from('jobs')
    .insert([jobData])
    .select()

  if (error || !data || data.length === 0) {
    console.error("Job creation error:", error)
    return { error: `Failed to create job: ${error?.message || 'Database insert failed'}` }
  }

  const jobId = data[0].id

  // Create default hiring workflow
  const { data: workflowData, error: workflowError } = await adminSupabase
    .from('hiring_workflows')
    .insert([{ job_id: jobId, is_active: true }])
    .select()

  if (!workflowError && workflowData && workflowData.length > 0) {
      const workflowId = workflowData[0].id
      
      // Create default stages (Application -> AI Assessment)
      await adminSupabase.from('workflow_stages').insert([
          { workflow_id: workflowId, name: 'Application Review', stage_type: 'application', order_index: 0, is_active: true },
          { workflow_id: workflowId, name: 'AI Assessment', stage_type: 'assessment', order_index: 1, is_active: true }
      ])
  }

  revalidatePath('/recruiter/jobs')
  redirect(`/recruiter/jobs/${jobId}/workflow`)
}

export async function closeJob(jobId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'closed' })
    .eq('id', jobId)

  if (error) {
      return { error: 'Failed to close job.' }
  }

  revalidatePath('/recruiter/jobs')
}
