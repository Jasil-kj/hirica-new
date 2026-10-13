import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { applicationService, Application } from '../services/applicationService';
import { DashboardLayout } from '../components/DashboardLayout';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  createdAt: any;
  recruiterUid: string;
}

export default function JobSeekerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        let querySnapshot;
        try {
          const jobsQuery = query(
            collection(db, 'jobs'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
          );
          querySnapshot = await getDocs(jobsQuery);
        } catch (idxError) {
          console.warn('Indexed query failed, falling back to basic collection query:', idxError);
          querySnapshot = await getDocs(collection(db, 'jobs'));
        }

        let jobsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];

        jobsList = jobsList.filter(job => !(job as any).status || (job as any).status === 'active');
        setJobs(jobsList);

        // Fetch candidate's applications
        const myApps = await applicationService.getApplicationsForCandidate(currentUser.uid);
        setApplications(myApps);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F4C3A]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const unlockedAssessmentsCount = applications.filter(a => a.status === 'approved_for_assessment').length;
  const submittedAppsCount = applications.length;

  return (
    <DashboardLayout activeTab="dashboard">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Candidate Portal</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Submit your CV to compute instant AI Resume Fit Scores and unlock technical assessments.
          </p>
        </div>
      </div>

      {/* CANDIDATE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* CARD 1 */}
        <div className="bg-gradient-to-br from-[#0F4C3A] to-[#083327] p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Available Jobs</span>
          <div className="mt-4">
            <h2 className="text-4xl font-black">{jobs.length}</h2>
            <p className="mt-1 text-xs text-emerald-300">Open tech roles ready for application</p>
          </div>
        </div>

        {/* CARD 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">My Applications</span>
          <div className="mt-4">
            <h2 className="text-4xl font-black text-gray-900">{submittedAppsCount}</h2>
            <p className="mt-1 text-xs text-emerald-600 font-bold">Applications submitted</p>
          </div>
        </div>

        {/* CARD 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Assessments Unlocked</span>
          <div className="mt-4">
            <h2 className="text-4xl font-black text-gray-900">{unlockedAssessmentsCount}</h2>
            <p className="mt-1 text-xs text-blue-600 font-bold">Approved by recruiters</p>
          </div>
        </div>
      </div>

      {/* JOB LISTINGS SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Available Job Openings</h2>

        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-base font-medium">No job openings available at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const myApp = applications.find(a => a.jobId === job.id);

              return (
                <div key={job.id} className="p-5 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-[#0F4C3A] hover:underline cursor-pointer" onClick={() => navigate(`/job/${job.id}`)}>
                        {job.title}
                      </h3>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                        {job.type}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-semibold mt-1">
                      {job.company} • {job.location}
                    </p>

                    {myApp && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                          myApp.status === 'selected'
                            ? 'bg-green-100 text-green-800'
                            : myApp.status === 'approved_for_assessment'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {myApp.status === 'selected' && '🎉 Shortlisted / Selected'}
                          {myApp.status === 'approved_for_assessment' && '✅ Assessment Unlocked'}
                          {myApp.status === 'pending_review' && '⏳ Application Under Review'}
                          {myApp.status === 'rejected' && 'Not Selected'}
                        </span>
                        <span className="font-bold text-gray-600">
                          AI Resume Match Score: <strong className="text-[#0F4C3A]">{myApp.aiMatchScore}%</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {myApp && (myApp.status === 'selected' || (myApp as any).assessmentScore !== undefined) && (
                      <button
                        onClick={() => navigate(`/interview/${myApp.id}`)}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all gap-1.5"
                      >
                        🎙️ {(myApp as any).interviewCompleted ? 'Retake AI Interview' : 'Start AI Interview'}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/job/${job.id}`)}
                      className={`inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
                        myApp?.status === 'approved_for_assessment'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-[#0F4C3A] hover:bg-[#093327] text-white'
                      }`}
                    >
                      {myApp?.status === 'approved_for_assessment' ? '⚡ Take Assessment' : myApp ? 'View Status' : 'Apply & Submit CV'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}