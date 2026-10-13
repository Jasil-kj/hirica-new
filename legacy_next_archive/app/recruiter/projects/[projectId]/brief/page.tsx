'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, FileText, CheckCircle } from 'lucide-react'

export default function ProjectBriefEditor({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [saving, setSaving] = useState(false)
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/recruiter/projects/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: params.projectId,
          title,
          description,
          submission_requirements: requirements,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 7 days
        })
      })
      
      if (response.ok) {
        alert('Project Brief published successfully.')
        router.push('/recruiter/projects')
      }
    } catch (error) {
      console.error('Error saving brief:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Project Brief Editor
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create a take-home assignment for your candidates</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving || !title || !description}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center shadow-sm"
        >
          {saving ? 'Saving...' : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Publish Brief
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., E-Commerce Shopping Cart Implementation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description & Goal</label>
          <textarea 
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Write the full prompt and requirements here (Markdown supported in production)..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Submission Requirements</label>
          <textarea 
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Provide a GitHub repository link, a deployed URL on Vercel, and a brief summary of your technical decisions."
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-md border border-blue-100 flex items-start mt-6">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-blue-800">Review Process</h4>
            <p className="text-sm text-blue-700 mt-1">
              Once published, candidates who reach the "Project" stage in your pipeline will receive an email to access this brief and submit their links.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
