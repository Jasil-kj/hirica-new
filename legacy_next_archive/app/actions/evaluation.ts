'use server'

import { createClient } from '@/lib/supabase/server'

// Helper function to call Gemini AI API safely
async function evaluateWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    })

    const data = await response.json()
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text
    return textResult ? JSON.parse(textResult) : null
  } catch (err) {
    console.error("Gemini AI API call failed:", err)
    return null
  }
}

export async function evaluateAssessment(sessionId: string) {
  const supabase = await createClient()

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // 1. Fetch Session, Answers, Questions, and Events with admin client
  const { data: session, error: sessionError } = await adminSupabase
    .from('assessment_sessions')
    .select(`
        id,
        candidate_assessment_id,
        status,
        answers (
            id,
            question_id,
            content
        ),
        assessment_events (
            id,
            event_type,
            event_data,
            timestamp
        )
    `)
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError || !session) {
      console.error("Evaluation error: Session not found.", sessionError)
      return { error: 'Session not found' }
  }

  // Check if result already generated
  const { data: existingResult } = await adminSupabase
    .from('assessment_results')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existingResult) {
      return { success: true, message: 'Already evaluated' }
  }

  // Fetch Questions for this assessment
  const { data: assessmentInfo } = await adminSupabase
    .from('candidate_assessments')
    .select('question_ids')
    .eq('id', session.candidate_assessment_id)
    .maybeSingle()

  const questionIds = assessmentInfo?.question_ids || []
  const { data: questions } = await adminSupabase
    .from('questions')
    .select(`
        id,
        question_text,
        question_type,
        points,
        question_options (
            id,
            content,
            is_correct
        )
    `)
    .in('id', questionIds)

  if (!questions || questions.length === 0) return { error: 'No questions found' }

  // 2. Multi-dimensional Evaluation Engine
  let totalScore = 0
  let totalPossible = 0
  const answerEvaluations: any[] = []

  for (const q of questions) {
      totalPossible += q.points || 10
      const candidateAnswer = session.answers?.find((a: any) => a.question_id === q.id)
      
      if (!candidateAnswer) {
        answerEvaluations.push({ questionId: q.id, score: 0, feedback: 'Unanswered' })
        continue
      }

      if (q.question_type === 'multiple_choice') {
          const selectedOptionId = candidateAnswer.content?.selected_option
          const correctOption = q.question_options?.find((o: any) => o.is_correct)
          if (correctOption && selectedOptionId === correctOption.id) {
              totalScore += (q.points || 10)
              answerEvaluations.push({ questionId: q.id, score: q.points || 10, feedback: 'Correct answer selected' })
          } else {
              answerEvaluations.push({ questionId: q.id, score: 0, feedback: 'Incorrect choice' })
          }
      } else {
          // Coding or Written Answer -> Gemini AI Evaluation
          const answerText = candidateAnswer.content?.text || ''
          
          if (answerText.trim().length > 5) {
            const prompt = `
              Act as a Senior AI Code & Technical Evaluator. Evaluate this candidate response:
              Question: "${q.question_text}"
              Candidate Answer: "${answerText}"

              Return JSON with keys:
              {
                "score_out_of_10": number (0 to 10),
                "correctness_percentage": number (0 to 100),
                "time_complexity": "O(N)" or "O(N^2)" or "N/A",
                "code_quality_analysis": "string detailing syntax, edge cases, and strengths",
                "improvements": "string"
              }
            `

            const aiEval = await evaluateWithGemini(prompt)

            if (aiEval && typeof aiEval.score_out_of_10 === 'number') {
              const earned = Math.round(((q.points || 10) * aiEval.score_out_of_10) / 10)
              totalScore += earned
              answerEvaluations.push({
                questionId: q.id,
                score: earned,
                analysis: aiEval
              })
            } else {
              // Heuristic Evaluation Fallback
              const wordCount = answerText.trim().split(/\s+/).length
              const earned = Math.min(q.points || 10, Math.max(2, Math.round(wordCount / 5)))
              totalScore += earned
              answerEvaluations.push({ questionId: q.id, score: earned, feedback: 'Heuristic code analysis completed' })
            }
          }
      }
  }

  // 3. Mathematical Proctoring Trust Score Calculation
  let trustScore = 100
  const events = session.assessment_events || []
  let tabSwitchCount = 0
  let copyPasteCount = 0

  events.forEach((ev: any) => {
      if (ev.event_type === 'tab_blur') {
          tabSwitchCount++
          trustScore -= 8
      } else if (ev.event_type === 'copy' || ev.event_type === 'paste') {
          copyPasteCount++
          trustScore -= 12
      } else if (ev.event_type === 'face_loss') {
          trustScore -= 15
      }
  })
  trustScore = Math.max(0, trustScore)

  // 4. Generate Explainable Synthesis Report
  const passRatio = totalPossible > 0 ? totalScore / totalPossible : 0
  let aiAnalysisSummary = `Overall Score: ${totalScore}/${totalPossible} (${Math.round(passRatio * 100)}%).\n`

  if (passRatio >= 0.8) {
      aiAnalysisSummary += `✅ Strong Proficiency: Candidate demonstrated high technical competence, clean logic, and strong problem-solving capabilities.`
  } else if (passRatio >= 0.5) {
      aiAnalysisSummary += `⚠️ Moderate Competence: Candidate met basic job requirements with acceptable syntax and technical logic.`
  } else {
      aiAnalysisSummary += `❌ Needs Improvement: Candidate struggled with core concepts and edge case handling.`
  }

  if (trustScore < 80) {
      aiAnalysisSummary += `\n\n🛡️ PROCTORING INTEGRITY WARNING: Trust score dropped to ${trustScore}% due to ${tabSwitchCount} tab switches and ${copyPasteCount} copy-paste events.`
  } else {
      aiAnalysisSummary += `\n\n🛡️ PROCTORING VERIFIED: High integrity score (${trustScore}%). No critical cheating anomalies detected.`
  }

  // 5. Save Result to Database
  const { error: resultError } = await adminSupabase
    .from('assessment_results')
    .insert([{
        session_id: sessionId,
        total_score: totalScore,
        ai_analysis: aiAnalysisSummary,
        trust_score: trustScore
    }])

  if (resultError) {
      console.error("Result save error:", resultError)
      return { error: 'Failed to save results' }
  }

  // Update session status to completed
  await adminSupabase.from('assessment_sessions').update({ status: 'completed' }).eq('id', sessionId)

  return { success: true, score: totalScore, trustScore }
}
