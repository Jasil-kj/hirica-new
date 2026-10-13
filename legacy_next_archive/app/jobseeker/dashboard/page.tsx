import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Briefcase, FileText, Search, ArrowRight, CheckCircle2, Clock } from 'lucide-react'

export default async function JobseekerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // Fetch candidate applications
  const { data: applications } = await adminSupabase
    .from('applications')
    .select('*, job:jobs(*)')
    .eq('candidate_id', user?.id || '')
    .order('created_at', { ascending: false })

  // Fetch recent active jobs to recommend
  const { data: featuredJobs } = await adminSupabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20">Candidate Portal</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">Welcome to Hirica</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">Explore active job opportunities, submit your applications, and complete automated skill assessments.</p>
        </div>
        <Link 
          href="/jobseeker/jobs" 
          className="inline-flex items-center px-6 py-3.5 rounded-2xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition shadow-lg shrink-0"
        >
          <Search className="w-5 h-5 mr-2" /> Browse Open Jobs
        </Link>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/jobseeker/jobs" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition flex items-center">
              Explore Job Listings <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition" />
            </h3>
            <p className="text-sm text-gray-500 mt-1">Discover new career opportunities tailored for your skill set.</p>
          </div>
        </Link>

        <Link href="/jobseeker/applications" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition flex items-center">
              Track Applications <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition" />
            </h3>
            <p className="text-sm text-gray-500 mt-1">Check the status of your submitted applications and interview invites.</p>
          </div>
        </Link>
      </div>

      {/* Recent Applications Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Your Applications</h3>
            <p className="text-sm text-gray-500">Track your current application stages.</p>
          </div>
          <Link href="/jobseeker/applications" className="text-sm font-semibold text-blue-600 hover:underline">
            View All
          </Link>
        </div>

        {applications && applications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {applications.map((app: any) => (
              <div key={app.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-3 rounded-xl transition">
                <div>
                  <h5 className="font-bold text-gray-900">{app.job?.title || 'Applied Position'}</h5>
                  <p className="text-xs text-gray-500 mt-0.5">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  <Clock className="w-3 h-3 mr-1" /> {app.status || 'Applied'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">You haven't submitted any applications yet.</p>
            <Link href="/jobseeker/jobs" className="inline-block mt-3 text-sm font-bold text-blue-600 hover:underline">
              Find a job and apply today →
            </Link>
          </div>
        )}
      </div>

      {/* Recommended Jobs */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Featured Opportunities</h3>
        {featuredJobs && featuredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredJobs.map((job: any) => (
              <div key={job.id} className="p-5 border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition bg-gray-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{job.job_type || 'Full-time'}</span>
                  <h4 className="font-bold text-gray-900 text-lg mt-2">{job.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{job.location || 'Remote'} • {job.department || 'Engineering'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">{job.salary_range || 'Competitive'}</span>
                  <Link href={`/jobseeker/jobs/${job.id}`} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No featured jobs available at the moment.</p>
        )}
      </div>
    </div>
  )
}
