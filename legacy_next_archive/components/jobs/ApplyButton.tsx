'use client'

import { useState } from 'react'
import Link from 'next/link'
import { applyForJob } from '@/app/actions/applications'
import { Loader2, CheckCircle2, ArrowRight, Sparkles, X } from 'lucide-react'

type ApplyButtonProps = {
  jobId: string
  hasApplied: boolean
}

export function ApplyButton({ jobId, hasApplied }: ApplyButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(hasApplied)
  const [showModal, setShowModal] = useState(false)

  const handleApply = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
        const result = await applyForJob(jobId)
        if (result?.error) {
            setError(result.error)
        } else {
            setApplied(true)
            setShowModal(true)
        }
    } catch (err: any) {
        setError(err?.message || "Unexpected error occurred")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <>
      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 mb-2">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Application Submitted!
              </span>

              <h3 className="text-2xl font-black text-gray-900 mb-2">You're All Set!</h3>
              <p className="text-gray-500 text-sm mb-6">
                Your application has been received. The recruiter has been notified and will review your profile shortly.
              </p>

              <div className="space-y-3">
                <Link
                  href="/jobseeker/applications"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-blue-500/30 text-center flex items-center justify-center"
                >
                  View My Applications <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <button
                  onClick={() => setShowModal(false)}
                  className="block w-full text-sm font-bold text-gray-500 hover:text-gray-800 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applied Banner / Button */}
      {applied ? (
        <div className="flex flex-col items-end">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-6 py-3.5 rounded-2xl flex items-center space-x-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-extrabold">Applied Successfully</p>
              <p className="text-xs font-medium text-emerald-600">Application submitted to recruiter</p>
            </div>
          </div>
          <Link href="/jobseeker/applications" className="text-xs font-bold text-blue-600 hover:underline mt-2 flex items-center">
            Track status in My Applications →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          <button
              onClick={handleApply}
              disabled={isLoading}
              className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center shadow-lg shadow-blue-500/30 text-base"
          >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Apply Now'}
          </button>
          {error && <p className="text-red-500 text-xs mt-2 font-bold text-center">{error}</p>}
        </div>
      )}
    </>
  )
}
