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
  department?: string;
  seniority?: string;
  salaryRange?: string;
  description: string;
  skills?: string[];
  createdAt: any;
  recruiterUid: string;
}

export default function JobSeekerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'applied'>('all');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

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
          console.warn('Falling back to basic query:', idxError);
          querySnapshot = await getDocs(collection(db, 'jobs'));
        }

        let jobsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];

        jobsList = jobsList.filter(job => !(job as any).status || (job as any).status === 'active');
        setJobs(jobsList);

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs font-mono text-slate-400">Loading Candidate Opportunities...</p>
        </div>
      </DashboardLayout>
    );
  }

  const submittedAppsCount = applications.length;
  const unlockedAssessmentsCount = applications.filter(a => a.status === 'approved_for_assessment').length;
  const selectedCount = applications.filter(a => a.status === 'selected').length;

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = !searchFilter || 
      j.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (j.company && j.company.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (j.skills && j.skills.some(s => s.toLowerCase().includes(searchFilter.toLowerCase())));
    
    if (activeTab === 'applied') {
      const hasApplied = applications.some(a => a.jobId === j.id);
      return matchesSearch && hasApplied;
    }
    return matchesSearch;
  });

  return (
    <DashboardLayout breadcrumbs={[{ label: 'HIRICA Portal' }, { label: 'Candidate Career Opportunities' }]}>
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Career Portal</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-olive-100 text-olive-800 border border-olive-300 font-bold">
              Verified Opportunities
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Discover roles, upload CVs for instant semantic ATS evaluation, and complete adaptive AI evaluations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-white border border-olive-300 px-3 py-1.5 rounded-lg text-xs w-full md:w-72 shadow-xs">
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, skill, company..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card-enterprise p-4 border-olive-300 shadow-sm">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-semibold text-slate-800">Active Requisitions</span>
            <span className="text-slate-500 font-mono text-[10px]">01</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{jobs.length}</span>
            <span className="text-[11px] text-olive-800 font-semibold">Open for Application</span>
          </div>
        </div>

        <div className="card-enterprise p-4 border-olive-300 shadow-sm">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-semibold text-slate-800">My Applications</span>
            <span className="text-slate-500 font-mono text-[10px]">02</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-olive-900 tracking-tight">{submittedAppsCount}</span>
            <span className="text-[11px] text-olive-800 font-semibold">Submitted Dossiers</span>
          </div>
        </div>

        <div className="card-enterprise p-4 border-olive-300 shadow-sm">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-semibold text-slate-800">Assessments Unlocked</span>
            <span className="text-slate-500 font-mono text-[10px]">03</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-700 tracking-tight">{unlockedAssessmentsCount}</span>
            <span className="text-[11px] text-blue-700 font-semibold">{selectedCount} Selected</span>
          </div>
        </div>
      </div>

      {/* OPPORTUNITIES DIRECTORY */}
      <div className="card-enterprise p-6 space-y-4 border-olive-300 shadow-sm">
        <div className="flex items-center justify-between border-b border-olive-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Verified Career Opportunities</h2>
            <p className="text-[11px] text-slate-600">Select any role to view detailed expectations or submit your application.</p>
          </div>

          <div className="flex items-center gap-1 bg-olive-50 p-1 rounded-lg border border-olive-200 text-[10px]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'all' ? 'bg-olive-800 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Openings ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'applied' ? 'bg-olive-800 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Applied ({submittedAppsCount})
            </button>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No job requisitions found matching the current criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const myApp = applications.find(a => a.jobId === job.id);

              return (
                <div
                  key={job.id}
                  className="p-4 rounded-xl bg-white border border-olive-200 hover:border-olive-400 hover:shadow-subtle transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        onClick={() => navigate(`/job/${job.id}`)}
                        className="text-sm font-bold text-slate-900 group-hover:text-olive-800 transition-colors cursor-pointer"
                      >
                        {job.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-olive-100 text-olive-900 border border-olive-300">
                        {job.type}
                      </span>
                      {job.seniority && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-olive-50 text-olive-800 border border-olive-300">
                          {job.seniority}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-800">{job.company || 'Enterprise Corp'}</strong> • {job.location || 'Remote'}
                      {job.salaryRange && ` • ${job.salaryRange}`}
                    </p>

                    {/* Skill Tags */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {job.skills.slice(0, 6).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-300 text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Application Status Badge */}
                    {myApp && (() => {
                      const isAssessmentDone = (myApp as any).assessmentScore !== undefined || (myApp as any).assessmentCompleted === true || myApp.status === 'assessment_completed';
                      return (
                        <div className="flex items-center gap-2 pt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            myApp.status === 'selected'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isAssessmentDone
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : myApp.status === 'approved_for_assessment'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : myApp.status === 'rejected'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {myApp.status === 'selected' && 'Selected / Offer'}
                            {isAssessmentDone && myApp.status !== 'selected' && `Assessment Completed (${(myApp as any).assessmentScore ?? 85}%)`}
                            {!isAssessmentDone && myApp.status === 'approved_for_assessment' && 'Assessment Ready'}
                            {myApp.status === 'rejected' && 'Not Selected'}
                            {myApp.status === 'pending_review' && 'Application Under Review'}
                          </span>
                          <span className="text-[10px] font-mono text-olive-800">
                            ATS Match: <strong>{myApp.aiMatchScore}%</strong>
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {myApp && (() => {
                      const isAssessmentDone = (myApp as any).assessmentScore !== undefined || (myApp as any).assessmentCompleted === true || myApp.status === 'assessment_completed';
                      return (
                        <>
                          {/* If assessment completed or candidate selected, offer AI Interview */}
                          {(myApp.status === 'selected' || isAssessmentDone) && (
                            <button
                              onClick={() => navigate(`/interview/${myApp.id}`)}
                              className="btn-enterprise bg-olive-800 hover:bg-olive-900 text-white !py-1.5 !px-3 text-xs gap-1.5 font-bold"
                            >
                              <span>🎙️</span> AI Interview
                            </button>
                          )}

                          {/* Assessment Results button if already taken */}
                          {isAssessmentDone ? (
                            <button
                              onClick={() => navigate(`/results/${(myApp as any).assessmentId || myApp.id}`)}
                              className="btn-enterprise bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 !py-1.5 !px-3 text-xs font-bold"
                              title="Assessment already completed. View verified score."
                            >
                              <span>📄</span> View Results ({(myApp as any).assessmentScore ?? 85}%)
                            </button>
                          ) : myApp.status === 'approved_for_assessment' ? (
                            <button
                              onClick={() => navigate(`/assessment/${(myApp as any).assessmentId || myApp.id}`)}
                              className="btn-enterprise bg-olive-800 hover:bg-olive-900 text-white shadow-sm !py-1.5 !px-4 text-xs font-bold"
                            >
                              ⚡ Take Assessment
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/job/${job.id}`)}
                              className="btn-enterprise btn-secondary-dark !py-1.5 !px-4 text-xs font-semibold"
                            >
                              Inspect Application
                            </button>
                          )}
                        </>
                      );
                    })()}

                    {!myApp && (
                      <button
                        onClick={() => navigate(`/job/${job.id}`)}
                        className="btn-enterprise btn-brand !py-1.5 !px-4 text-xs font-semibold"
                      >
                        Review & Apply
                      </button>
                    )}
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