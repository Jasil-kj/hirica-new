'use client'

import { useState } from 'react'
import { advanceCandidateStage } from '@/app/actions/stages'
import { Play, Loader2 } from 'lucide-react'

type Props = {
  applicationId: string
  stageId: string
  stageName: string
}

export function AdvanceCandidateButton({ applicationId, stageId, stageName }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAdvance = async () => {
      setIsLoading(true)
      await advanceCandidateStage(applicationId, stageId)
      setIsLoading(false)
  }

  return (
      <button 
          onClick={handleAdvance}
          disabled={isLoading}
          className="flex items-center bg-brand-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Play className="w-3 h-3 mr-1.5" />}
          Move to {stageName}
      </button>
  )
}
