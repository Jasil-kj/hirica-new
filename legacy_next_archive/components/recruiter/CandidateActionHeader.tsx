'use client'

import { useState } from 'react'
import { updateApplicationStatus } from '@/app/actions/stages'
import { AdvanceCandidateButton } from '@/components/jobs/AdvanceCandidateButton'
import { CheckCircle2, XCircle, Clock, Award, Loader2 } from 'lucide-react'

type Props = {
  applicationId: string
  currentStatus: string
  nextStage: { id: string; name: string } | null
}

export function CandidateActionHeader({ applicationId, currentStatus, nextStage }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)

  const handleStatusChange = async (newStatus: 'hired' | 'rejected' | 'on_hold') => {
    if (!confirm(`Are you sure you want to mark this candidate as ${newStatus.toUpperCase()}?`)) return
    
    setIsLoading(true)
    const result = await updateApplicationStatus(applicationId, newStatus)
    setIsLoading(false)

    if (result?.success) {
      setStatus(newStatus)
    }
  }

  if (status === 'hired') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <Award className="w-7 h-7 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-extrabold text-lg text-emerald-900">Candidate Hired 🎉</h4>
            <p className="text-xs text-emerald-700">Official hire decision recorded. Notification sent to candidate.</p>
          </div>
        </div>
        <span className="text-xs font-black uppercase px-3 py-1 bg-emerald-600 text-white rounded-full">
          HIRED
        </span>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <XCircle className="w-7 h-7 text-red-600 shrink-0" />
          <div>
            <h4 className="font-extrabold text-lg text-red-900">Application Rejected</h4>
            <p className="text-xs text-red-700">Candidate has been notified of the decision.</p>
          </div>
        </div>
        <span className="text-xs font-black uppercase px-3 py-1 bg-red-600 text-white rounded-full">
          REJECTED
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recruiter Actions</p>
        <h4 className="font-bold text-gray-900 text-base mt-0.5">Manage Candidate Pipeline Decision</h4>
      </div>

      <div className="flex items-center space-x-3">
        {/* Advance Stage Button */}
        {nextStage && (
          <AdvanceCandidateButton 
            applicationId={applicationId} 
            stageId={nextStage.id} 
            stageName={nextStage.name} 
          />
        )}

        {/* Hire Candidate */}
        <button
          onClick={() => handleStatusChange('hired')}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition flex items-center shadow-sm disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Award className="w-4 h-4 mr-2" />}
          Hire Candidate
        </button>

        {/* Hold Candidate */}
        <button
          onClick={() => handleStatusChange('on_hold')}
          disabled={isLoading}
          className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold px-3.5 py-2.5 rounded-xl text-sm transition flex items-center"
        >
          <Clock className="w-4 h-4 mr-1.5" /> Hold
        </button>

        {/* Reject Candidate */}
        <button
          onClick={() => handleStatusChange('rejected')}
          disabled={isLoading}
          className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold px-3.5 py-2.5 rounded-xl text-sm transition flex items-center"
        >
          <XCircle className="w-4 h-4 mr-1.5" /> Reject
        </button>
      </div>
    </div>
  )
}
