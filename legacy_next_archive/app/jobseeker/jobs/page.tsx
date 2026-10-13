import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search } from 'lucide-react'

export default async function JobseekerJobsPage() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // For job seekers, show all published jobs
  const { data: jobs } = await adminSupabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
            <h1 className="text-4xl font-black text-black mb-4 tracking-tight">Find your next role</h1>
            <p className="text-gray-500 text-lg">Browse top companies actively hiring.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs?.map((job) => {
                // Type assertion for Supabase join
                const companyName = (job.recruiter as any)?.recruiter_profiles?.[0]?.company_name || 'Company Name'

                return (
                    <div key={job.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl transition-shadow relative flex flex-col h-full">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-black mb-1">{job.title}</h3>
                            <p className="text-brand-blue font-bold text-sm mb-4">{companyName}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="bg-gray-50 text-gray-600 text-xs font-bold px-2 py-1 rounded-md border border-gray-100">
                                    {job.location}
                                </span>
                                <span className="bg-gray-50 text-gray-600 text-xs font-bold px-2 py-1 rounded-md border border-gray-100">
                                    {job.employment_type}
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-50">
                            <Link 
                                href={`/jobseeker/jobs/${job.id}`} 
                                className="block w-full text-center bg-brand-black text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                            >
                                View Job Details
                            </Link>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  )
}
