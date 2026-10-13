'use client'

import { useState } from 'react'
import { saveAssessmentConfig } from '@/app/actions/assessments'
import { Loader2, Settings, ShieldCheck, Clock, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ConfigFormProps = {
  stageId: string
  jobId: string
  existingConfig?: any
}

export function AssessmentConfigForm({ stageId, jobId, existingConfig }: ConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
        const res = await saveAssessmentConfig(formData, stageId, jobId)
        if (res?.error) {
            setError(res.error)
        } else {
            router.push(`/recruiter/jobs/${jobId}/workflow`)
        }
    } catch (err) {
        setError("An unexpected error occurred.")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
      <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-brand-blue">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-black">Assessment Configuration</h2>
          <p className="text-sm text-gray-500">Configure parameters for AI question generation and proctoring.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Settings */}
        <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-400" /> Timing & Scoring</h3>
            
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Duration (Minutes)</label>
                    <input 
                        name="duration_minutes"
                        type="number" 
                        min="10"
                        max="180"
                        defaultValue={existingConfig?.duration_minutes || 60}
                        required 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Passing Score (%)</label>
                    <input 
                        name="passing_score"
                        type="number" 
                        min="1"
                        max="100"
                        defaultValue={existingConfig?.passing_score || 70}
                        required 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                    />
                </div>
            </div>
        </div>

        <div className="w-full h-px bg-gray-100"></div>

        {/* Content Settings */}
        <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center"><Target className="w-5 h-5 mr-2 text-gray-400" /> AI Generation Rules</h3>
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty Level</label>
                <select 
                    name="difficulty" 
                    defaultValue={existingConfig?.difficulty || 'mid'}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                >
                    <option value="junior">Junior / Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior / Expert</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Skills to Test (Comma separated)</label>
                <input 
                    name="skills_required"
                    type="text" 
                    defaultValue={existingConfig?.skills_required?.join(', ') || 'React, TypeScript, Problem Solving'}
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                />
                <p className="text-xs text-gray-400 mt-2">The AI will generate questions specifically targeting these skills.</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Allowed Languages (For Coding Tasks)</label>
                <input 
                    name="allowed_languages"
                    type="text" 
                    defaultValue={existingConfig?.allowed_languages?.join(', ') || 'javascript, python, java, cpp'}
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                />
            </div>
        </div>

        <div className="w-full h-px bg-gray-100"></div>

        {/* Proctoring Settings */}
        <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-gray-400" /> AI Proctoring</h3>
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Strictness Level</label>
                <select 
                    name="proctoring_strictness" 
                    defaultValue={existingConfig?.proctoring_strictness || 'medium'}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue"
                >
                    <option value="low">Low (Tab switches allowed, warnings only)</option>
                    <option value="medium">Medium (Records tab switches, face tracking)</option>
                    <option value="high">High (Auto-terminate on violation, full lock)</option>
                </select>
            </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-brand-black text-white font-bold py-4 px-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-70 mt-8"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Configuration'}
        </button>
      </form>
    </div>
  )
}
