'use client'

import { useEffect, useState } from 'react'
import { logProctoringEvent } from '@/app/actions/proctoring'
import { AlertTriangle, X } from 'lucide-react'

type Props = {
  sessionId: string
  strictness: string
}

export function ProctoringTracker({ sessionId, strictness }: Props) {
  const [warnings, setWarnings] = useState<string[]>([])
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // If low strictness, maybe we just log and don't warn much.
    // If high, maybe we auto-submit (omitted for safety in this mockup).

    let tabLeaveTime: number | null = null

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        tabLeaveTime = Date.now()
        await logProctoringEvent(sessionId, 'tab_blur', { strictness })
      } else {
        const awayTime = tabLeaveTime ? (Date.now() - tabLeaveTime) / 1000 : 0
        await logProctoringEvent(sessionId, 'tab_focus', { away_seconds: awayTime })
        
        if (strictness !== 'low') {
            const warningMsg = `You switched tabs for ${awayTime.toFixed(1)} seconds. This event has been recorded.`
            setWarnings(prev => [...prev, warningMsg])
            setShowWarning(true)
        }
      }
    }

    const handleWindowBlur = async () => {
        // Blur might mean they clicked another window on a dual monitor
        await logProctoringEvent(sessionId, 'window_blur', {})
    }

    const handleCopyPaste = async (e: Event) => {
        e.preventDefault()
        await logProctoringEvent(sessionId, e.type, {})
        if (strictness !== 'low') {
            setWarnings(prev => [...prev, `${e.type.toUpperCase()} action is disabled and has been recorded.`])
            setShowWarning(true)
        }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)
    
    // Disable copy paste
    document.addEventListener('copy', handleCopyPaste)
    document.addEventListener('paste', handleCopyPaste)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
      document.removeEventListener('copy', handleCopyPaste)
      document.removeEventListener('paste', handleCopyPaste)
    }
  }, [sessionId, strictness])

  if (!showWarning || warnings.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-red-600 text-white p-4 rounded-2xl shadow-2xl border border-red-500 animate-in slide-in-from-top-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-red-200" />
            <div>
                <h4 className="font-bold">Proctoring Alert</h4>
                <p className="text-sm mt-1 text-red-100">{warnings[warnings.length - 1]}</p>
            </div>
        </div>
        <button onClick={() => setShowWarning(false)} className="text-red-200 hover:text-white p-1">
            <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
