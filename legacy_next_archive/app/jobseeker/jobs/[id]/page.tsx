import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, MapPin, Briefcase, Calendar } from 'lucide-react'
import { ApplyButton } from '@/components/jobs/ApplyButton'

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Await the params properly as Next.js 15+ sometimes requires it
  const { id } = await Promise.resolve(params);

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  const { data: job } = await adminSupabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!job) {
      return <div className="p-8 text-center">Job not found.</div>
  }

  // Check if candidate already applied
  const { data: { user } } = await supabase.auth.getUser()
  let hasApplied = false
  if (user) {
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('candidate_id', user.id)
        .single()
      if (existingApp) hasApplied = true
  }

  const companyName = (job.recruiter as any)?.recruiter_profiles?.[0]?.company_name || 'Company Name'

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-brand-black text-white pt-16 pb-24 px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
            <Link href="/jobseeker/jobs" className="text-sm font-bold text-gray-400 flex items-center hover:text-white mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{job.title}</h1>
            <p className="text-xl text-blue-200 font-bold mb-8">{companyName}</p>
            
            <div className="flex flex-wrap gap-6">
                <div className="flex items-center text-sm font-medium">
                    <MapPin className="w-5 h-5 mr-2 opacity-70" /> {job.location}
                </div>
                <div className="flex items-center text-sm font-medium">
                    <Briefcase className="w-5 h-5 mr-2 opacity-70" /> {job.employment_type}
                </div>
                <div className="flex items-center text-sm font-medium">
                    <Calendar className="w-5 h-5 mr-2 opacity-70" /> Posted {new Date(job.created_at).toLocaleDateString()}
                </div>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-12 flex justify-between items-center">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <p className="font-bold text-black">{job.status === 'published' ? 'Accepting Applications' : 'Closed'}</p>
            </div>
            {job.status === 'published' && (
                <ApplyButton jobId={job.id} hasApplied={hasApplied} />
            )}
        </div>

        <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mb-4">About the Role</h2>
            <div className="whitespace-pre-wrap text-gray-600 leading-relaxed mb-10">
                {job.description}
            </div>

            <h2 className="text-2xl font-bold text-black mb-4">Requirements</h2>
            <div className="whitespace-pre-wrap text-gray-600 leading-relaxed mb-10">
                {job.requirements}
            </div>
        </div>
      </div>
    </div>
  )
}
