'use client'

import { useState, useEffect, useCallback } from 'react'
import { saveAnswer, submitAssessment } from '@/app/actions/assessmentSession'
import { Clock, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'

type Props = {
  sessionId: string
  questions: any[]
  durationMinutes: number
  startTime: string
}

export function AssessmentRunner({ sessionId, questions, durationMinutes, startTime }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    await submitAssessment(sessionId)
    window.location.href = '/jobseeker/applications'
  }, [sessionId])

  // Timer logic
  useEffect(() => {
    const end = new Date(startTime).getTime() + durationMinutes * 60000
    
    const timer = setInterval(() => {
        const now = new Date().getTime()
        const remaining = Math.max(0, Math.floor((end - now) / 1000))
        setTimeLeft(remaining)

        if (remaining <= 0) {
            clearInterval(timer)
            handleSubmit()
        }
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, durationMinutes, handleSubmit])

  const currentQ = questions[currentIndex]

  const handleOptionSelect = async (optionId: string) => {
      const newAnswers = { ...answers, [currentQ.id]: { selected_option: optionId } }
      setAnswers(newAnswers)
      // Save in background
      await saveAnswer(sessionId, currentQ.id, { selected_option: optionId })
  }

  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newAnswers = { ...answers, [currentQ.id]: { text: e.target.value } }
      setAnswers(newAnswers)
  }

  const handleTextBlur = async () => {
      if (answers[currentQ.id]) {
          await saveAnswer(sessionId, currentQ.id, answers[currentQ.id])
      }
  }

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center text-white shrink-0">
            <div className="font-bold text-xl tracking-tighter">Hirica<span className="text-brand-blue">.</span></div>
            
            <div className={`flex items-center space-x-2 font-mono font-bold text-lg px-4 py-2 rounded-xl border ${timeLeft < 300 ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-gray-800 border-gray-700'}`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
            </div>
            
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
            {/* Sidebar nav */}
            <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto hidden md:block">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Questions</p>
                <div className="grid grid-cols-4 gap-2">
                    {questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors
                                ${currentIndex === idx ? 'bg-brand-blue text-white ring-2 ring-brand-blue ring-offset-2 ring-offset-gray-900' : 
                                answers[q.id] ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:bg-gray-800'}`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 bg-black p-8 md:p-12 overflow-y-auto relative">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <span className="text-brand-blue font-bold tracking-wider text-sm uppercase">Question {currentIndex + 1} of {questions.length}</span>
                        <h2 className="text-2xl md:text-3xl text-white font-bold mt-2 leading-relaxed">
                            {currentQ.content}
                        </h2>
                    </div>

                    {/* Options / Input */}
                    <div className="mt-8">
                        {currentQ.question_type === 'multiple_choice' ? (
                            <div className="space-y-3">
                                {currentQ.question_options?.map((opt: any) => {
                                    const isSelected = answers[currentQ.id]?.selected_option === opt.id
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleOptionSelect(opt.id)}
                                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center
                                                ${isSelected 
                                                    ? 'border-brand-blue bg-blue-900/20 text-white' 
                                                    : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700 hover:bg-gray-800'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center shrink-0 ${isSelected ? 'border-brand-blue bg-brand-blue' : 'border-gray-600'}`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <span className="text-lg">{opt.content}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <textarea
                                value={answers[currentQ.id]?.text || ''}
                                onChange={handleTextChange}
                                onBlur={handleTextBlur}
                                placeholder="Type your code or answer here..."
                                className="w-full h-96 bg-gray-900 border-2 border-gray-800 text-gray-100 p-6 rounded-2xl font-mono focus:ring-0 focus:border-brand-blue resize-none"
                            ></textarea>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="mt-12 flex justify-between">
                        <button
                            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                            disabled={currentIndex === 0}
                            className="px-6 py-3 rounded-xl font-bold text-gray-400 bg-gray-900 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-30 flex items-center"
                        >
                            <ChevronLeft className="w-5 h-5 mr-2" /> Previous
                        </button>

                        <button
                            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                            disabled={currentIndex === questions.length - 1}
                            className="px-6 py-3 rounded-xl font-bold text-white bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-30 flex items-center"
                        >
                            Next <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>
  )
}
