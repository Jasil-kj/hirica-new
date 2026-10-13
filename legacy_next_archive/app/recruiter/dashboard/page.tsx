import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Briefcase, Users, FileCheck, Plus, ArrowRight, BarChart2, CheckCircle2 } from 'lucide-react'

export default async function RecruiterDashboard() {
  const supabase = await createClient()

  // Fetch count of jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch count of applications
  const { count: applicationCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })

  const activeJobsCount = jobs?.length || 0

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Recruiter Command Center</h1>
          <p className="text-blue-100 text-sm mt-1">Manage job postings, review applicants, and configure automated assessments.</p>
        </div>
        <Link 
          href="/recruiter/jobs/create" 
          className="inline-flex items-center px-5 py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition shadow"
        >
          <Plus className="w-5 h-5 mr-2" /> Post New Job
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Jobs</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeJobsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Candidates</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{applicationCount || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessments</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">Ready</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analytics</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">Live</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/recruiter/jobs" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Briefcase className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition flex items-center">
            Jobs Management <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition" />
          </h4>
          <p className="text-sm text-gray-500 mt-1">View, edit, and track applicants for all open positions.</p>
        </Link>

        <Link href="/recruiter/assessments" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <FileCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition flex items-center">
            Assessments Config <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition" />
          </h4>
          <p className="text-sm text-gray-500 mt-1">Configure automated AI assessments, proctoring & test suites.</p>
        </Link>

        <Link href="/recruiter/analytics" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <BarChart2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition flex items-center">
            Analytics & Reports <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition" />
          </h4>
          <p className="text-sm text-gray-500 mt-1">Track recruitment funnels, candidate pass rates, and time-to-hire.</p>
        </Link>
      </div>

      {/* Recent Jobs Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Job Listings</h3>
            <p className="text-sm text-gray-500">Positions currently accepting candidate applications.</p>
          </div>
          <Link href="/recruiter/jobs" className="text-sm font-semibold text-blue-600 hover:underline">
            View All Jobs
          </Link>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {jobs.map((job: any) => (
              <div key={job.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-3 rounded-xl transition">
                <div>
                  <h5 className="font-bold text-gray-900">{job.title}</h5>
                  <p className="text-xs text-gray-500 mt-0.5">{job.location || 'Remote'} • {job.job_type || 'Full-time'}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                  </span>
                  <Link 
                    href={`/recruiter/jobs/${job.id}`} 
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">No jobs posted yet.</p>
            <Link href="/recruiter/jobs/create" className="inline-block mt-3 text-sm font-bold text-blue-600 hover:underline">
              Create your first job posting →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
