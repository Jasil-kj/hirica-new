'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitBranch, Link as LinkIcon, Download, Check, X, MessageSquare } from 'lucide-react'

export default function SubmissionsReview({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])

  useEffect(() => {
    // Mock fetch
    setTimeout(() => {
      setSubmissions([
        {
          id: 'sub_1',
          candidate_name: 'Alex Johnson',
          status: 'submitted',
          github_url: 'https://github.com/alexj/ecommerce-cart',
          live_url: 'https://alex-cart.vercel.app',
          comments: 'I used Zustand for state management to avoid prop drilling.',
          submitted_at: '2026-08-18T10:00:00Z'
        },
        {
          id: 'sub_2',
          candidate_name: 'Maria Garcia',
          status: 'evaluated',
          result: 'passed',
          github_url: 'https://github.com/mgarcia/react-cart',
          live_url: '',
          comments: '',
          submitted_at: '2026-08-17T14:30:00Z'
        }
      ])
    }, 800)
  }, [params.projectId])

  const handleEvaluate = async (submissionId: string, result: 'passed' | 'failed') => {
    try {
      const response = await fetch('/api/recruiter/projects/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, result })
      })

      if (response.ok) {
        setSubmissions(prev => 
          prev.map(s => s.id === submissionId ? { ...s, status: 'evaluated', result } : s)
        )
      }
    } catch (error) {
      console.error('Evaluation failed', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Submissions</h1>
          <p className="text-gray-500 mt-1">Review take-home assignments for this project</p>
        </div>
      </div>

      <div className="space-y-6">
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {sub.candidate_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{sub.candidate_name}</h3>
                  <p className="text-xs text-gray-500">Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {sub.status === 'evaluated' ? (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.result === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {sub.result === 'passed' ? 'PASSED' : 'FAILED'}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                  NEEDS REVIEW
                </span>
              )}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Deliverables</h4>
                  
                  {sub.github_url && (
                    <a href={sub.github_url} target="_blank" rel="noreferrer" className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 transition-colors">
                      <GitBranch className="h-5 w-5 mr-3 text-gray-400" />
                      <span className="flex-1 font-medium truncate">{sub.github_url}</span>
                    </a>
                  )}

                  {sub.live_url && (
                    <a href={sub.live_url} target="_blank" rel="noreferrer" className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-blue-600 transition-colors">
                      <LinkIcon className="h-5 w-5 mr-3 text-blue-400" />
                      <span className="flex-1 font-medium truncate">{sub.live_url}</span>
                    </a>
                  )}

                  {!sub.github_url && !sub.live_url && (
                    <button className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 w-full transition-colors">
                      <Download className="h-5 w-5 mr-3 text-gray-400" />
                      <span className="flex-1 font-medium text-left">Download project.zip</span>
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Candidate Comments
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm text-gray-700 italic min-h-[100px]">
                    {sub.comments ? `"${sub.comments}"` : 'No additional comments provided.'}
                  </div>
                </div>
              </div>

              {sub.status !== 'evaluated' && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end space-x-4">
                  <button 
                    onClick={() => handleEvaluate(sub.id, 'failed')}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 flex items-center font-medium"
                  >
                    <X className="h-4 w-4 mr-1" /> Fail
                  </button>
                  <button 
                    onClick={() => handleEvaluate(sub.id, 'passed')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center font-medium shadow-sm"
                  >
                    <Check className="h-4 w-4 mr-1" /> Pass Candidate
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {submissions.length === 0 && (
          <div className="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No submissions yet for this project.</p>
          </div>
        )}
      </div>
    </div>
  )
}
