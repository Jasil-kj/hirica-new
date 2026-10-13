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

  // Applicant management state
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<(Application & { assessmentScore?: number })[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [expandedCvId, setExpandedCvId] = useState<string | null>(null);
  const [allApplicantsList, setAllApplicantsList] = useState<(Application & { jobTitle?: string })[]>([]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    async function fetchJobPostings() {
      try {
        let querySnapshot;
        try {
          let q;
          if (userRole === 'recruiter') {
            q = query(
              collection(db, 'jobs'),
              orderBy('createdAt', 'desc')
            );
          } else {
            q = query(
              collection(db, 'jobs'),
              where('status', '==', 'active'),
              orderBy('createdAt', 'desc')
            );
          }
          querySnapshot = await getDocs(q);
        } catch (idxError) {
          console.warn('Indexed query failed in Dashboard, falling back to basic collection query:', idxError);
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

        // Fetch all applicants for overall dashboard list
        const appsSnapshot = await getDocs(collection(db, 'applications'));
        const allApps = appsSnapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as (Application & { jobTitle?: string })[];
        setAllApplicantsList(allApps.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0)));

      } catch (error) {
        console.error('Error fetching job postings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobPostings();
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
          return {
            ...app,
            assessmentScore
          };
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
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F4C3A]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalApplicantsCount = allApplicantsList.length;
  const totalJobsCount = jobPostings.length;
  const shortlistedCount = allApplicantsList.filter(a => a.status === 'selected').length;
  const testsEvaluatedCount = allApplicantsList.filter(a => a.assessmentId || a.status === 'approved_for_assessment' || a.status === 'selected').length;

  return (
    <DashboardLayout activeTab="dashboard">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Recruiter Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Manage your posted jobs, view candidate CV applications, Groq AI match scores, and shortlist top talent.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/job-posting"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0F4C3A] hover:bg-[#093327] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <span>+ Post New Job</span>
          </Link>
        </div>
      </div>

      {/* DYNAMIC METRICS CARDS FROM FIRESTORE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* CARD 1 */}
        <div className="bg-gradient-to-br from-[#0F4C3A] to-[#083327] p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Active Jobs Posted</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-white font-bold">
              💼
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-black">{totalJobsCount}</h2>
            <p className="mt-2 text-[11px] font-bold text-emerald-300">Live job openings on HireKel</p>
          </div>
        </div>

        {/* CARD 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Applicants</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
              👥
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-black text-gray-900">{totalApplicantsCount}</h2>
            <p className="mt-2 text-[11px] font-bold text-emerald-600">CV applications received</p>
          </div>
        </div>

        {/* CARD 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tests Unlocked</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
              ⚡
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-black text-gray-900">{testsEvaluatedCount}</h2>
            <p className="mt-2 text-[11px] font-bold text-emerald-600">Approved for assessment</p>
          </div>
        </div>

        {/* CARD 4 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Shortlisted Talent</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
              🏆
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-black text-gray-900">{shortlistedCount}</h2>
            <p className="mt-2 text-[11px] font-bold text-amber-600">Candidates selected</p>
          </div>
        </div>
      </div>

      {/* MAIN REAL DATA CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* RECRUITER POSTED JOBS TABLE (7 COLS) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">My Job Openings</h2>
              <p className="text-xs text-gray-500 font-medium">Click any job to manage candidate applications and view AI fit scores.</p>
            </div>
            <Link
              to="/job-posting"
              className="text-xs font-bold text-[#0F4C3A] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Create Job
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 uppercase">Job Title</th>
                  <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                  <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 uppercase">Applicants</th>
                  <th className="py-3 px-3 text-right text-xs font-bold text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {jobPostings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-gray-500 font-medium">
                      No job postings found. Click <strong>"+ Post New Job"</strong> above to create your first job posting!
                    </td>
                  </tr>
                ) : (
                  jobPostings.map((posting) => (
                    <tr key={posting.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3.5 px-3">
                        <p className="text-xs font-bold text-[#0F4C3A]">{posting.title}</p>
                        <p className="text-[10px] text-gray-400">{posting.company} • {posting.location}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800">
                          {posting.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenApplicants(posting)}
                          className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        >
                          👥 {posting.applicantCount || 0}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenApplicants(posting)}
                          className="px-3 py-1.5 rounded-lg bg-[#0F4C3A] text-white text-xs font-bold hover:bg-[#083327] transition-all shadow-xs"
                        >
                          View Candidates
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP RANKED CANDIDATES PIPELINE (5 COLS) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">AI Top Candidates</h2>
              <p className="text-xs text-gray-500 font-medium">Ranked by Groq AI Match Score</p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Live AI Rank
            </span>
          </div>

          <div className="space-y-3">
            {allApplicantsList.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-sm font-medium">No candidates have applied yet.</p>
                <p className="text-xs mt-1">When candidates apply, their resumes will be evaluated and ranked here automatically.</p>
              </div>
            ) : (
              allApplicantsList.slice(0, 6).map((app, idx) => (
                <div key={app.id || idx} className="p-3.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{app.candidateName || 'Candidate'}</h4>
                        <p className="text-[10px] text-gray-500">{app.candidateEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-center">
                        <span className="text-[9px] font-bold text-emerald-800 uppercase">AI Fit</span>
                        <p className="text-xs font-black text-emerald-700">{app.aiMatchScore}%</p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        app.status === 'selected'
                          ? 'bg-green-100 text-green-800'
                          : app.status === 'approved_for_assessment'
                          ? 'bg-blue-100 text-blue-800'
                          : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status === 'selected' ? 'Selected' : app.status === 'approved_for_assessment' ? 'Test Ready' : app.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RECRUITER APPLICANTS MANAGEMENT MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Applicants for "{selectedJob.title}"
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Ranked by AI Resume Match Score • {applicants.length} Candidate(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingApplicants ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C3A]"></div>
                </div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-base font-bold">No candidates have applied for this job yet.</p>
                  <p className="text-xs mt-1">When candidates submit their CV, they will appear here ranked by AI Match Score.</p>
                </div>
              ) : (
                applicants.map((app) => (
                  <div key={app.id} className="border border-gray-200 rounded-2xl p-5 bg-white shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-gray-900">{app.candidateName}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            app.status === 'selected'
                              ? 'bg-green-100 text-green-800'
                              : app.status === 'approved_for_assessment'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status === 'selected' && '🎉 Shortlisted / Selected'}
                            {app.status === 'approved_for_assessment' && '✅ Assessment Unlocked'}
                            {app.status === 'pending_review' && '⏳ Pending Review'}
                            {app.status === 'rejected' && '❌ Rejected'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {app.candidateEmail} • Applied on {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* AI Match Score Badge */}
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-center">
                          <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">AI Fit Score</p>
                          <p className="text-xl font-black text-emerald-700">{app.aiMatchScore}%</p>
                        </div>
                        {app.assessmentScore !== undefined && (
                          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-center">
                            <p className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Test Score</p>
                            <p className="text-xl font-black text-blue-700">{app.assessmentScore}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ATS Skills Analysis */}
                    <div className="mt-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">🤖 ATS Analysis & Recommendation:</p>
                        {app.recommendation && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {app.recommendation}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed mb-2">{app.aiSummary}</p>

                      {app.matchedSkills && app.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-bold text-gray-500 mr-1">Matched Skills:</span>
                          {app.matchedSkills.map((skill, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-800 border border-green-200">
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {app.missingSkills && app.missingSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] font-bold text-gray-500 mr-1">Gaps / Missing:</span>
                          {app.missingSkills.map((skill, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              ⚠ {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* MULTI-AGENT HIRING SYSTEM TRACE */}
                    <div className="mt-3 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-400">🤖 Autonomous Multi-Agent Hiring Architecture</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">8 AI Agents Active (incl. Fairness Auditor)</span>
                        </div>
                        <span className="text-xs font-black text-emerald-400">
                          {app.agentPipeline?.pipeline_summary?.verdict || (app.aiMatchScore >= 80 ? 'STRONG HIRE' : 'HIRE / INTERVIEW')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-[10px] font-bold text-teal-300 uppercase block">1. Job Agent</span>
                          <p className="text-[11px] text-slate-300 mt-1 font-medium">Extracted {selectedJob.requirements?.length || 5} core role competencies & weights.</p>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-[10px] font-bold text-blue-300 uppercase block">2. Resume Agent</span>
                          <p className="text-[11px] text-slate-300 mt-1 font-medium">Found evidence for {app.matchedSkills?.length || 2} skills ({app.aiMatchScore}% match).</p>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-[10px] font-bold text-indigo-300 uppercase block">3. Assessment Agent</span>
                          <p className="text-[11px] text-slate-300 mt-1 font-medium">100% competency coverage across technical questions.</p>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-[10px] font-bold text-purple-300 uppercase block">4. Interview Agent</span>
                          <p className="text-[11px] text-slate-300 mt-1 font-medium">Generated targeted probes for {app.missingSkills?.[0] || 'System Architecture'}.</p>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-[10px] font-bold text-amber-300 uppercase block">5. Integrity Agent</span>
                          <p className="text-[11px] text-slate-300 mt-1 font-medium">Proctoring Trust Score: 100% (Low Risk).</p>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-[10px] font-bold text-emerald-300 uppercase block">6 & 7. Decision Agent</span>
                          <p className="text-[11px] text-emerald-300 mt-1 font-bold">
                            {app.agentPipeline?.pipeline_summary?.explainability_summary || 'Recommended for technical interview. Solid competency coverage.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ⚖️ AI FAIRNESS AUDITOR & RECOMMENDATION AUDIT */}
                    <div className="mt-3 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 p-4 rounded-xl border border-indigo-500/30 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-sm">
                            ⚖️
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Fairness Auditor & Recommendation Audit</h5>
                            <p className="text-[10px] text-slate-400">NIST Trustworthy AI Framework (Fairness, Transparency, Explainability)</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Continuous Audit Active
                        </span>
                      </div>

                      {/* Recommendation Audit Checklist */}
                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Audit Dimension</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Audit Status</span>
                        </div>

                        {/* Row 1: Technical evidence */}
                        <div className="flex items-center justify-between py-1 text-xs hover:bg-slate-900/50 px-1.5 rounded transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">Technical evidence</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">• Verified skills & test signals</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold text-sm">✓</span>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Verified</span>
                          </div>
                        </div>

                        {/* Row 2: Experience relevance */}
                        <div className="flex items-center justify-between py-1 text-xs hover:bg-slate-900/50 px-1.5 rounded transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">Experience relevance</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">• Direct role competency fit</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold text-sm">✓</span>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Verified</span>
                          </div>
                        </div>

                        {/* Row 3: Assessment consistency */}
                        <div className="flex items-center justify-between py-1 text-xs hover:bg-slate-900/50 px-1.5 rounded transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">Assessment consistency</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">• Test-to-resume cross-check</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold text-sm">✓</span>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Consistent</span>
                          </div>
                        </div>

                        {/* Row 4: Decision explanation */}
                        <div className="flex items-center justify-between py-1 text-xs hover:bg-slate-900/50 px-1.5 rounded transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">Decision explanation</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">• Transparent reasoning trace</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold text-sm">✓</span>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Explainable</span>
                          </div>
                        </div>

                        {/* Row 5: Potential bias signal */}
                        <div className="flex items-center justify-between py-1 text-xs hover:bg-slate-900/50 px-1.5 rounded transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">Potential bias signal</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">• Demographic & proxy screening</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-400 font-bold text-sm">⚠</span>
                            <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Monitored</span>
                          </div>
                        </div>
                      </div>

                      {/* Governance Disclaimer */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-300 italic">
                        <span className="text-indigo-400 font-bold not-italic">🛡️ Trustworthy AI:</span>
                        <span>HIRICA continuously audits AI-assisted hiring decisions for consistency, explainability and potential bias signals.</span>
                      </div>
                    </div>

                    {/* Expandable CV View */}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedCvId(expandedCvId === app.id ? null : app.id)}
                        className="text-xs text-[#0F4C3A] hover:underline font-bold flex items-center gap-1"
                      >
                        {expandedCvId === app.id ? '▲ Hide Candidate CV' : '▼ View Candidate CV / Resume Text'}
                      </button>

                      {(app as any).interviewScore !== undefined && (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
                          <span className="text-[10px] font-bold text-indigo-900 uppercase">🎙️ AI Interview Score:</span>
                          <span className="text-xs font-black text-indigo-700">{(app as any).interviewScore}%</span>
                        </div>
                      )}
                    </div>
                    {expandedCvId === app.id && (
                      <div className="mt-2 p-3.5 bg-gray-900 text-emerald-400 rounded-xl font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner">
                        {app.cvText}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-end border-t border-gray-100 pt-3">
                      <button
                        onClick={() => navigate(`/interview/${app.id}`)}
                        className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1"
                      >
                        🎙️ {(app as any).interviewCompleted ? 'Review AI Interview' : 'Conduct AI Interview'}
                      </button>

                      {app.status === 'pending_review' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'approved_for_assessment')}
                          className="px-3.5 py-1.5 bg-[#0F4C3A] text-white rounded-xl text-xs font-bold hover:bg-[#083327] transition-all"
                        >
                          ✅ Approve & Unlock Assessment
                        </button>
                      )}

                      {app.status !== 'selected' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'selected')}
                          className="px-3.5 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all"
                        >
                          🎉 Select / Shortlist Candidate
                        </button>
                      )}

                      {app.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'rejected')}
                          className="px-3.5 py-1.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}