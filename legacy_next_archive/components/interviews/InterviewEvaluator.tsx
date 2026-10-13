'use client'

import { useState } from 'react'
import { evaluateInterview } from '@/app/actions/interviews'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type Props = {
  instanceId: string
  applicationId: string
  stageName: string
}

export function InterviewEvaluator({ instanceId, applicationId, stageName }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<'pass' | 'fail' | null>(null)

  const handleEvaluate = async (passed: boolean) => {
      setIsLoading(true)
      setAction(passed ? 'pass' : 'fail')
      await evaluateInterview(instanceId, applicationId, passed)
      setIsLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
        <h3 className="font-bold text-lg text-black mb-2">Log Result: {stageName}</h3>
        <p className="text-sm text-gray-500 mb-6">Review the candidate's interview performance and determine if they should advance.</p>
        
        <div className="flex space-x-4">
            <button
                onClick={() => handleEvaluate(true)}
                disabled={isLoading}
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-3 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50"
            >
                {isLoading && action === 'pass' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                Pass / Approve
            </button>
            <button
                onClick={() => handleEvaluate(false)}
                disabled={isLoading}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50"
            >
                {isLoading && action === 'fail' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                Fail / Reject
            </button>
        </div>
    </div>
  )
}
