'use client'

import { useState } from 'react'
import { generateQuestions } from '@/app/actions/questions'
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

type QuestionOption = {
    id: string
    content: string
    is_correct: boolean
}

type Question = {
    id: string
    content: string
    question_type: string
    points: number
    question_options: QuestionOption[]
}

type Props = {
  stageId: string
  jobId: string
  questions: Question[]
}

export function QuestionBank({ stageId, jobId, questions }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    try {
        const res = await generateQuestions(stageId, jobId)
        if (res?.error) setError(res.error)
    } catch (err) {
        setError("An unexpected error occurred.")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
            <div>
                <h3 className="text-xl font-bold text-black flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-brand-blue" /> AI Question Bank
                </h3>
                <p className="text-sm text-gray-500 mt-1">Questions will be generated based on your configuration above.</p>
            </div>
            
            <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-blue-500/30 disabled:opacity-70 transition-colors hover:bg-blue-700"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Questions
            </button>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
                {error}
            </div>
        )}

        {questions.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No questions generated yet. Click "Generate Questions" to create them.</p>
            </div>
        ) : (
            <div className="space-y-6">
                {questions.map((q, i) => (
                    <div key={q.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">
                                    Question {i + 1} • {q.question_type.replace('_', ' ')} • {q.points} points
                                </span>
                                <p className="font-bold text-black text-lg">{q.content}</p>
                            </div>
                        </div>

                        {q.question_options && q.question_options.length > 0 && (
                            <div className="space-y-2 mt-4">
                                {q.question_options.map(opt => (
                                    <div key={opt.id} className={`flex items-center p-3 rounded-lg border ${opt.is_correct ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${opt.is_correct ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                                            {opt.is_correct && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-sm ${opt.is_correct ? 'font-bold text-green-700' : 'text-gray-600'}`}>{opt.content}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
  )
}
