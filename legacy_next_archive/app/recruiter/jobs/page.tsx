import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Briefcase } from 'lucide-react'

export default async function RecruiterJobsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-black">My Job Postings</h1>
            <Link 
                href="/recruiter/jobs/create" 
                className="bg-brand-blue text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors flex items-center shadow-lg shadow-blue-500/30"
            >
                <Plus className="w-4 h-4 mr-2" /> Post New Job
            </Link>
        </div>

        {(!jobs || jobs.length === 0) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">No jobs posted yet</h3>
                <p className="text-gray-500 mb-6">Create your first job posting to start finding top talent.</p>
                <Link 
                    href="/recruiter/jobs/create" 
                    className="bg-brand-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors inline-block"
                >
                    Post a Job
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-black">{job.title}</h3>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${job.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                {job.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{job.department}</p>
                        <p className="text-sm text-gray-500 mb-4">{job.location} • {job.employment_type}</p>
                        
                        <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">
                                Posted {new Date(job.created_at).toLocaleDateString()}
                            </span>
                            <Link href={`/recruiter/jobs/${job.id}`} className="text-sm font-bold text-brand-blue hover:underline">
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}
