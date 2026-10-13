'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function CandidateProjectBrief({ params }: { params: { projectId: string } }) {
  const [brief, setBrief] = useState<any>(null)
  
  useEffect(() => {
    // Mock fetch in this demonstration
    setTimeout(() => {
      setBrief({
        title: 'E-Commerce Shopping Cart Implementation',
        description: 'You are tasked with building a responsive shopping cart component using React. Requirements:\n\n1. Display a list of products (mock data is fine).\n2. Allow users to add/remove items to the cart.\n3. Display the total price, updating dynamically.\n4. Ensure the state persists across page reloads (e.g., using localStorage).\n5. Style it to look modern and professional.',
        submission_requirements: 'Provide a GitHub repository link, a deployed URL on Vercel/Netlify, and a brief summary of your technical decisions in the README.',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
      })
    }, 800)
  }, [params.projectId])

  if (!brief) return <div className="p-8 text-center text-gray-500">Loading project brief...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="inline-block bg-white/20 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase mb-4">
            Take-Home Assignment
          </div>
          <h1 className="text-3xl font-bold mb-4">{brief.title}</h1>
          <div className="flex items-center text-blue-100 font-medium">
            <Calendar className="h-5 w-5 mr-2" />
            Due by {brief.deadline}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Project Prompt
            </h2>
            <div className="prose max-w-none text-gray-700 bg-gray-50 p-6 rounded-lg border border-gray-100 whitespace-pre-wrap">
              {brief.description}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Requirements</h2>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 text-yellow-800">
              {brief.submission_requirements}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500 font-medium">
            Take your time and submit when ready.
          </p>
          <Link 
            href={`/jobseeker/projects/${params.projectId}/submit`}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm flex items-center transition-colors"
          >
            Ready to Submit
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}
