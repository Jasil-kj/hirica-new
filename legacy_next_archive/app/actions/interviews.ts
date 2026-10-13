'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function callGeminiAPI(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) return null

  try {
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
    return textResult ? JSON.parse(textResult) : null
  } catch (err) {
    console.error("AI Interview call error:", err)
    return null
  }
}

export async function evaluateInterview(instanceId: string, applicationId: string, passed: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // Update instance status using admin client
  const { error: instanceError } = await adminSupabase
    .from('candidate_stage_instances')
    .update({ status: passed ? 'completed' : 'failed' })
    .eq('id', instanceId)

  if (instanceError) {
      console.error("Interview evaluation error:", instanceError)
      return { error: 'Failed to update interview status' }
  }

  // If failed, reject application; if passed, notify candidate
  if (!passed) {
      await adminSupabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId)
  }

  revalidatePath(`/recruiter/jobs`)
  revalidatePath('/jobseeker/applications')
  return { success: true }
}

export async function generateAIInterviewQuestions(jobTitle: string, candidateName: string) {
  const prompt = `
    Act as an Expert Technical & HR AI Interviewer for the position of "${jobTitle}".
    Generate 3 adaptive interview questions for candidate "${candidateName}".

    Return JSON format:
    {
      "questions": [
        { "id": "1", "category": "Technical Depth", "question": "string" },
        { "id": "2", "category": "Problem Solving", "question": "string" },
        { "id": "3", "category": "HR & Culture", "question": "string" }
      ]
    }
  `

  const result = await callGeminiAPI(prompt)
  if (result?.questions) return { success: true, questions: result.questions }

  // Fallback intelligent questions
  return {
    success: true,
    questions: [
      { id: "1", category: "Technical Depth", question: `How do you structure scalable solutions for a ${jobTitle} role?` },
      { id: "2", category: "Problem Solving", question: "Describe a complex technical bug you identified and how you resolved it." },
      { id: "3", category: "HR & Culture", question: "What motivates you to perform at your best in a fast-paced engineering team?" }
    ]
  }
}
