'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function generateAIQuestionsWithGemini(jobTitle: string, jobDesc: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) return null

  const prompt = `
    Act as a Senior AI Assessment Architect & Competency Blueprint Generator.
    Analyze the full LinkedIn / Indeed style Job Metadata Specification:

    "${jobDesc}"

    REQUIREMENT:
    1. Read the "Key Technical Skills" and generate questions that test THOSE EXACT SKILLS.
    2. Read the "Experience Level" (Entry, Mid-Senior, Senior) and calibrate difficulty (Easy/Medium/Hard).
    3. Read the "AI Test Focus" (Coding vs System Design vs Logic) and set the question distribution.

    Generate 3 distinct, highly relevant assessment questions:
    - Question 1: Multiple Choice (Technical Skill Specific)
    - Question 2: Multiple Choice (Technical / Conceptual)
    - Question 3: Coding or Practical Problem Solving

    Return strictly valid JSON format:
    {
      "questions": [
        {
          "type": "multiple_choice",
          "content": "Question text...",
          "points": 10,
          "options": [
            { "text": "Option A", "is_correct": true },
            { "text": "Option B", "is_correct": false },
            { "text": "Option C", "is_correct": false },
            { "text": "Option D", "is_correct": false }
          ]
        },
        {
          "type": "coding",
          "content": "Coding problem statement...",
          "points": 30,
          "options": []
        }
      ]
    }
  `

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
    console.error("Gemini question generation error:", err)
    return null
  }
}

// Dynamic Heuristic Fallback based on Job Title
function getHeuristicQuestionPool(jobTitle: string, jobDesc: string) {
  const isSenior = jobDesc.includes('Senior') || jobDesc.includes('Lead')
  const isFrontend = jobTitle.toLowerCase().includes('frontend') || jobTitle.toLowerCase().includes('react')
  const isBackend = jobTitle.toLowerCase().includes('backend') || jobTitle.toLowerCase().includes('node') || jobTitle.toLowerCase().includes('python')

  if (isFrontend) {
    return [
      {
        type: 'multiple_choice',
        content: 'Which React hook should be used to memoize expensive computations between renders?',
        options: [
          { text: 'useCallback', is_correct: false },
          { text: 'useMemo', is_correct: true },
          { text: 'useEffect', is_correct: false },
          { text: 'useRef', is_correct: false }
        ],
        points: 10
      },
      {
        type: 'multiple_choice',
        content: 'What is the primary advantage of Virtual DOM reconciliation in modern web frameworks?',
        options: [
          { text: 'Minimizes costly direct browser DOM manipulations.', is_correct: true },
          { text: 'Bypasses browser JavaScript engine execution.', is_correct: false },
          { text: 'Replaces CSS layout engine completely.', is_correct: false },
          { text: 'Automatically encrypts local storage data.', is_correct: false }
        ],
        points: 10
      },
      {
        type: 'coding',
        content: 'Write a JavaScript function `debouncedSearch(fn, delay)` that returns a debounced version of `fn` to prevent excessive API invocations.',
        options: [],
        points: 30
      }
    ]
  }

  if (isBackend) {
    return [
      {
        type: 'multiple_choice',
        content: 'What does ACID consistency guarantee in relational database transactions?',
        options: [
          { text: 'Transactions bring the database from one valid state to another.', is_correct: true },
          { text: 'Data is replicated across 3 continents instantly.', is_correct: false },
          { text: 'No locks are acquired during write operations.', is_correct: false },
          { text: 'All queries complete in under 1 millisecond.', is_correct: false }
        ],
        points: 10
      },
      {
        type: 'multiple_choice',
        content: 'Which HTTP status code represents a successful resource creation via POST request?',
        options: [
          { text: '200 OK', is_correct: false },
          { text: '201 Created', is_correct: true },
          { text: '204 No Content', is_correct: false },
          { text: '302 Found', is_correct: false }
        ],
        points: 10
      },
      {
        type: 'coding',
        content: 'Write a backend algorithm in Node.js/Python that implements rate-limiting using the Token Bucket algorithm.',
        options: [],
        points: 30
      }
    ]
  }

  // General Software Engineering
  return [
    {
      type: 'multiple_choice',
      content: `Targeting role: ${jobTitle}. Which data structure offers O(1) average time complexity for key lookups?`,
      options: [
        { text: 'Binary Search Tree', is_correct: false },
        { text: 'Hash Map / Dictionary', is_correct: true },
        { text: 'Array List', is_correct: false },
        { text: 'Queue', is_correct: false }
      ],
      points: 10
    },
    {
      type: 'multiple_choice',
      content: 'In distributed systems architecture, what is the primary purpose of a Load Balancer?',
      options: [
        { text: 'Distributes incoming network traffic evenly across backend servers.', is_correct: true },
        { text: 'Compiles client-side TypeScript code into WebAssembly.', is_correct: false },
        { text: 'Generates database migrations automatically.', is_correct: false },
        { text: 'Monitors client browser webcam feeds.', is_correct: false }
      ],
      points: 10
    },
    {
      type: 'coding',
      content: `Implement an optimal solution for ${jobTitle} candidates: Write a function \`twoSum(nums, target)\` that finds two numbers in an array that sum up to target in O(N) time.`,
      options: [],
      points: 30
    }
  ]
}

export async function generateQuestions(stageId: string, jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // 1. Fetch Job details including the rich Indeed/LinkedIn specification block
  const { data: job } = await adminSupabase
    .from('jobs')
    .select('title, description')
    .eq('id', jobId)
    .maybeSingle()

  const jobTitle = job?.title || 'Software Engineer'
  const jobDesc = job?.description || 'General engineering role'

  // 2. Generate calibrated questions using Gemini AI or Job-Specific Heuristic Engine
  const aiGenerated = await generateAIQuestionsWithGemini(jobTitle, jobDesc)
  const questionSet = aiGenerated?.questions || getHeuristicQuestionPool(jobTitle, jobDesc)

  // 3. Create a new Assessment Version with adminSupabase
  const { data: version, error: verError } = await adminSupabase
    .from('assessment_versions')
    .insert([{ stage_id: stageId, version_number: 1, is_published: true }])
    .select()
    .single()

  if (verError || !version) {
      console.error("Version creation error:", verError)
      return { error: 'Failed to create assessment version.' }
  }

  // 4. Insert generated questions into the database
  for (const mq of questionSet) {
      const { data: qData, error: qError } = await adminSupabase
        .from('questions')
        .insert([{
            assessment_version_id: version.id,
            question_type: mq.type,
            content: mq.content,
            question_text: mq.content,
            points: mq.points
        }])
        .select()
        .single()
        
      if (qError) {
          console.error("Question creation error:", qError)
          continue
      }

      // Insert options if multiple choice
      if (mq.options && mq.options.length > 0) {
          const optionsToInsert = mq.options.map((opt: any) => ({
              question_id: qData.id,
              content: opt.text,
              is_correct: opt.is_correct
          }))
          
          await adminSupabase.from('question_options').insert(optionsToInsert)
      }
  }

  revalidatePath(`/recruiter/jobs/${jobId}/stages/${stageId}/config`)
  return { success: true }
}
