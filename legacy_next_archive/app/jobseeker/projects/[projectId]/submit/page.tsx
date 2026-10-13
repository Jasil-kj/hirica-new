'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, GitBranch, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CandidateProjectSubmit({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrl) {
      setError('A GitHub repository link is required.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/jobseeker/projects/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: params.projectId,
          github_url: githubUrl,
          live_url: liveUrl,
          comments
        })
      })

      if (response.ok) {
        router.push('/jobseeker/dashboard?success=project_submitted')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit project.')
      }
    } catch (err) {
      setError('An error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Project</h1>
      <p className="text-gray-600 mb-8">Double-check your links to ensure the recruiter can access your work.</p>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md border border-red-200 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <GitBranch className="h-4 w-4 mr-2" />
              GitHub Repository URL <span className="text-red-500 ml-1">*</span>
            </label>
            <input 
              type="url" 
              required
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Make sure the repository is public or you've invited the requested reviewers.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Link2 className="h-4 w-4 mr-2" />
              Live Deployment URL (Optional)
            </label>
            <input 
              type="url" 
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://my-project.vercel.app"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea 
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any setup instructions, architectural decisions, or caveats you want to mention?"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              File Upload (Alternative)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
              <p className="text-sm text-gray-500 mb-2">If requested, upload a ZIP file or PDF instead of a repository.</p>
              <button type="button" className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
                Choose File
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between items-center">
          <Link href={`/jobseeker/projects/${params.projectId}/brief`} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
            Review Prompt Again
          </Link>
          <button 
            type="submit"
            disabled={submitting || !githubUrl}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm flex items-center disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Submit Assignment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
