import { JobForm } from '@/components/jobs/JobForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreateJobPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <Link href="/recruiter/jobs" className="text-sm font-bold text-brand-blue flex items-center hover:underline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
            </Link>
        </div>
        <JobForm />
      </div>
    </div>
  )
}
