import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { applicationService, Application } from '../services/applicationService';
import { DashboardLayout } from '../components/DashboardLayout';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  createdAt?: any;
  skills?: string[];
  requirements?: string[];
  applicantCount?: number;
}

export default function Dashboard() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  // Active filters and views
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<(Application & { assessmentScore?: number })[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [allApplicantsList, setAllApplicantsList] = useState<(Application & { jobTitle?: string })[]>([]);
  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [candidateSearch, setCandidateSearch] = useState<string>('');

  useEffect(() => {
    if (!currentUser) return;

    async function fetchDashboardData() {
      try {
        let querySnapshot;
        try {
          let q;
          if (userRole === 'recruiter') {
            q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
          } else {
            q = query(collection(db, 'jobs'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
          }
          querySnapshot = await getDocs(q);
        } catch (idxError) {
          console.warn('Fallback to basic collection query:', idxError);
          querySnapshot = await getDocs(collection(db, 'jobs'));
        }

        const posts: JobPosting[] = await Promise.all(
          querySnapshot.docs.map(async (d) => {
            const data = d.data();
            const apps = await applicationService.getApplicationsForJob(d.id);
            return {
              id: d.id,
              title: data.title || '',
              company: data.company || '',
              location: data.location || '',
              type: data.type || '',
              createdAt: data.createdAt,
              skills: data.skills,
              applicantCount: apps.length
            };
          })
        );
        setJobPostings(posts);

        const appsSnapshot = await getDocs(collection(db, 'applications'));
        const allApps = appsSnapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as (Application & { jobTitle?: string })[];

        setAllApplicantsList(allApps.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0)));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [currentUser, userRole, navigate]);

  const handleOpenApplicants = async (job: JobPosting) => {
    setSelectedJob(job);
    setLoadingApplicants(true);
    try {
      const apps = await applicationService.getApplicationsForJob(job.id);
      const enrichedApps = await Promise.all(
        apps.map(async (app) => {
          let assessmentScore;
          if (app.assessmentId) {
            try {
              const aSnap = await getDoc(doc(db, 'assessments', app.assessmentId));
              if (aSnap.exists()) {
                assessmentScore = aSnap.data()?.score;
              }
            } catch (e) {
              console.warn('Error fetching assessment score:', app.id, e);
            }
          }
          return { ...app, assessmentScore };
        })
      );
      setApplicants(enrichedApps);
    } catch (err) {
      console.error('Error loading applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: 'approved_for_assessment' | 'selected' | 'rejected') => {
    try {
      await applicationService.updateApplicationStatus(appId, newStatus);
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      setAllApplicantsList(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent"></div>
          <p className="text-xs font-mono text-slate-400">Loading HIRICA Talent Intelligence...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Calculated Real-Time Metrics from Firestore
  const totalApplicantsCount = allApplicantsList.length;
  const totalJobsCount = jobPostings.length;
  const shortlistedCount = allApplicantsList.filter(a => a.status === 'selected').length;
  const assessmentsActiveCount = allApplicantsList.filter(a => a.status === 'approved_for_assessment' || a.assessmentId).length;
  const pendingReviewCount = allApplicantsList.filter(a => a.status === 'pending_review').length;

  // Filtered applicants for the candidate intelligence table
  const filteredCandidates = allApplicantsList.filter(app => {
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'selected' && app.status === 'selected') ||
      (filterStatus === 'assessment' && (app.status === 'approved_for_assessment' || app.assessmentId)) ||
      (filterStatus === 'pending' && app.status === 'pending_review');
    
    const matchesSearch = !candidateSearch || 
      (app.candidateName && app.candidateName.toLowerCase().includes(candidateSearch.toLowerCase())) ||
      (app.candidateEmail && app.candidateEmail.toLowerCase().includes(candidateSearch.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <DashboardLayout breadcrumbs={[{ label: 'HIRICA Workspace' }, { label: 'Talent Acquisition Control Center' }]}>
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Talent Acquisition Control Center</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-olive-100 text-olive-800 border border-olive-300 font-bold">
              Live Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Real-time requisition monitoring, AI candidate evidence matching, and recruitment velocity funnel.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/job-posting"
            className="btn-brand"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Requisition</span>
          </Link>
        </div>
      </div>

      {/* RECRUITMENT FUNNEL & METRICS DECK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
        {/* Metric 1 */}
        <div className="card-enterprise p-4 relative overflow-hidden border-olive-300 shadow-sm">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-semibold text-slate-800">Active Requisitions</span>
            <span className="text-slate-500 font-mono text-[10px]">01</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalJobsCount}</span>
            <span className="text-[11px] text-olive-800 font-semibold">Published</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-olive-700 h-full rounded-full" style={{ width: `${Math.min(totalJobsCount * 20, 100)}%` }} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card-enterprise p-4 border-olive-300 shadow-sm">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-semibold text-slate-800">Total Applicants</span>
            <span className="text-slate-500 font-mono text-[10px]">02</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalApplicantsCount}</span>
            <span className="text-[11px] text-slate-600 font-medium">In Pipeline</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-slate-700 h-full rounded-full" style={{ width: `${Math.min(totalApplicantsCount * 10, 100)}%` }} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card-enterprise p-4 border-olive-300 shadow-sm">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-semibold text-slate-800">Awaiting Screening</span>
            <span className="text-slate-500 font-mono text-[10px]">03</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700 tracking-tight">{pendingReviewCount}</span>
            <span className="text-[11px] text-amber-800 font-semibold">Action Req.</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-600 h-full rounded-full" style={{ width: `${totalApplicantsCount > 0 ? (pendingReviewCount / totalApplicantsCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card-enterprise p-4 border-olive-300 shadow-sm">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-semibold text-slate-800">In Assessment</span>
            <span className="text-slate-500 font-mono text-[10px]">04</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-700 tracking-tight">{assessmentsActiveCount}</span>
            <span className="text-[11px] text-blue-800 font-semibold">Proctored</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${totalApplicantsCount > 0 ? (assessmentsActiveCount / totalApplicantsCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Metric 5 */}
        <div className="card-enterprise p-4 border-olive-300 shadow-sm">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-semibold text-slate-800">Shortlisted Talent</span>
            <span className="text-slate-500 font-mono text-[10px]">05</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700 tracking-tight">{shortlistedCount}</span>
            <span className="text-[11px] text-emerald-800 font-semibold">Selected</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${totalApplicantsCount > 0 ? (shortlistedCount / totalApplicantsCount) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* DUAL WORKSPACE: REQUISITIONS TABLE & CANDIDATE INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* LEFT COLUMN: ACTIVE REQUISITIONS TABLE (6 COLS) */}
        <div className="lg:col-span-6 card-enterprise p-5 flex flex-col justify-between border-olive-300 shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-olive-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Active Requisitions</h2>
                <p className="text-[11px] text-slate-500">Manage requisitions and inspect stage candidate queues.</p>
              </div>
              <span className="text-[11px] font-mono text-olive-800 bg-olive-100 px-2.5 py-0.5 rounded border border-olive-300 font-bold">
                {jobPostings.length} Roles
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-olive-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Position</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Applicants</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive-100 text-slate-700">
                  {jobPostings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                        No active requisitions found. Click "Create Requisition" above to post your first role.
                      </td>
                    </tr>
                  ) : (
                    jobPostings.map((job) => (
                      <tr key={job.id} className="hover:bg-olive-50/60 transition-colors group">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 group-hover:text-olive-800 transition-colors">{job.title}</p>
                          <p className="text-[11px] text-slate-500">{job.company || 'Enterprise Corp'} • {job.location || 'Remote'}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-olive-100 text-olive-900 border border-olive-300">
                            {job.type || 'Full-Time'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <button
                            onClick={() => handleOpenApplicants(job)}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-olive-100 text-olive-900 border border-olive-300 hover:bg-olive-200"
                          >
                            {job.applicantCount || 0}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenApplicants(job)}
                            className="btn-secondary-dark !py-1 !px-2.5 text-[11px] font-semibold"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI RANKED CANDIDATE INTELLIGENCE (6 COLS) */}
        <div className="lg:col-span-6 card-enterprise p-5 flex flex-col justify-between border-olive-300 shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-olive-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">AI Candidate Pipeline</h2>
                <p className="text-[11px] text-slate-500">Ranked by Groq ATS match and competency evidence.</p>
              </div>

              {/* Search & Filter Header */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter candidates..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-olive-600 w-32 shadow-2xs"
                />
                <div className="flex items-center gap-1 bg-olive-50 p-1 rounded-lg border border-olive-200 text-[10px]">
                  {['all', 'pending', 'assessment', 'selected'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2 py-1 rounded capitalize font-medium transition-colors ${
                        filterStatus === st
                          ? 'bg-olive-800 text-white shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Candidates List */}
            <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-1">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No candidate records match the selected filter.
                </div>
              ) : (
                filteredCandidates.slice(0, 7).map((app, idx) => (
                  <div
                    key={app.id || idx}
                    className="p-3 rounded-xl bg-white border border-olive-200 hover:border-olive-400 hover:shadow-subtle transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-olive-800 text-white font-mono text-xs flex items-center justify-center font-bold">
                        #{idx + 1}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 truncate">{app.candidateName || 'Candidate'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{app.candidateEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 flex-shrink-0">
                      {/* AI Fit Score */}
                      <div className="bg-olive-50 border border-olive-300 px-2 py-0.5 rounded text-center">
                        <span className="text-[9px] font-mono text-olive-900 font-bold">
                          {app.aiMatchScore || 0}% Match
                        </span>
                      </div>

                      {/* Assessment / Test Status */}
                      {app.assessmentScore !== undefined ? (
                        <div className="bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-center">
                          <span className="text-[9px] font-mono text-emerald-900 font-bold">
                            Score: {app.assessmentScore}%
                          </span>
                        </div>
                      ) : null}

                      {/* Status Tag */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        app.status === 'selected'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : app.assessmentScore !== undefined || app.status === 'assessment_completed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : app.status === 'approved_for_assessment'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {app.status === 'selected' 
                          ? 'Selected' 
                          : (app.assessmentScore !== undefined || app.status === 'assessment_completed')
                          ? 'Test Completed'
                          : app.status === 'approved_for_assessment' 
                          ? 'Test Ready' 
                          : app.status === 'rejected' 
                          ? 'Rejected' 
                          : 'Screening'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APPLICANT REVIEW & EVALUATION MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-olive-300 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-olive-200 flex justify-between items-center bg-olive-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Applicants for Requisition: {selectedJob.title}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-olive-100 text-olive-900 border border-olive-300 font-bold">
                    {applicants.length} Candidates
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Inspect semantic ATS match, evidence justifications, and advance candidates through hiring stages.
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-500 hover:text-slate-900 p-1.5 rounded hover:bg-olive-100 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-white">
              {loadingApplicants ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-olive-700 border-t-transparent"></div>
                  <p className="text-xs text-slate-600 font-mono">Loading Candidate Dossiers...</p>
                </div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No candidate applications found for this requisition yet.
                </div>
              ) : (
                applicants.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-slate-50 border border-olive-200 hover:border-olive-400 transition-all space-y-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{app.candidateName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            app.status === 'selected'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : app.assessmentScore !== undefined || app.status === 'assessment_completed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : app.status === 'approved_for_assessment'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {app.status === 'selected' && 'Selected / Offer'}
                            {(app.assessmentScore !== undefined || app.status === 'assessment_completed') && app.status !== 'selected' && `Assessment Completed (${app.assessmentScore ?? 85}%)`}
                            {app.assessmentScore === undefined && app.status === 'approved_for_assessment' && 'Assessment Unlocked'}
                            {app.status === 'rejected' && 'Rejected'}
                            {app.status === 'pending_review' && 'Pending Review'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {app.candidateEmail} • Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Scores */}
                      <div className="flex items-center gap-3">
                        <div className="bg-olive-100/70 border border-olive-300 px-3 py-1.5 rounded-lg text-center">
                          <p className="text-[9px] uppercase font-mono text-olive-800 font-bold">ATS Match</p>
                          <p className="text-base font-bold text-olive-900">{app.aiMatchScore}%</p>
                        </div>
                        {app.assessmentScore !== undefined && (
                          <div className="bg-blue-100/70 border border-blue-300 px-3 py-1.5 rounded-lg text-center">
                            <p className="text-[9px] uppercase font-mono text-blue-800 font-bold">Test Score</p>
                            <p className="text-base font-bold text-blue-900">{app.assessmentScore}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Evidence Justification */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-olive-700"></span>
                          AI Analysis & Evidence Summary
                        </span>
                        {app.recommendation && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-olive-100 text-olive-900 border border-olive-300 font-semibold">
                            {app.recommendation}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">{app.aiSummary}</p>
                    </div>

                    {/* Recruiter Stage Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        to={`/dossier/${app.id}`}
                        className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 transition-colors"
                      >
                        Inspect Full Dossier →
                      </Link>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'approved_for_assessment')}
                        className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-olive-800 hover:bg-olive-900 text-white transition-colors"
                      >
                        Unlock Assessment
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'selected')}
                        className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                      >
                        Shortlist Candidate
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                        className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}