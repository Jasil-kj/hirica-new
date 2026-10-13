import { type FC, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { applicationService, Application } from '../services/applicationService';
import { DashboardLayout } from '../components/DashboardLayout';
import apiClient from '../services/apiClient';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  department?: string;
  seniority?: string;
  salaryRange?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills?: string[];
  createdAt: Timestamp;
}

const JobDetail: FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application & CV state
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [cvText, setCvText] = useState('');
  const [candidateName, setCandidateName] = useState(currentUser?.displayName || '');
  const [candidateEmail, setCandidateEmail] = useState(currentUser?.email || '');
  const [applying, setApplying] = useState(false);

  // File upload and ATS preview state
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [atsPreview, setAtsPreview] = useState<any | null>(null);
  const [evaluatingPreview, setEvaluatingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setSelectedFileName(file.name);
    setParsingFile(true);
    setAtsPreview(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/parse-cv-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.status === 'success' && res.data.extracted_text) {
        const text = res.data.extracted_text;
        setCvText(text);

        // Instantly run ATS match evaluation
        if (job?.requirements && job.requirements.length > 0) {
          setEvaluatingPreview(true);
          try {
            const preview = await applicationService.evaluateResume(job.title, job.requirements, text);
            setAtsPreview(preview);
          } catch (pErr) {
            console.warn('ATS preview error:', pErr);
          } finally {
            setEvaluatingPreview(false);
          }
        }
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert('Failed to extract text from CV file. Please try pasting manually.');
    } finally {
      setParsingFile(false);
    }
  };

  const handleRunManualATS = async () => {
    if (!cvText.trim() || !job?.requirements?.length) return;
    setEvaluatingPreview(true);
    try {
      const preview = await applicationService.evaluateResume(job.title, job.requirements, cvText);
      setAtsPreview(preview);
    } catch (err) {
      console.warn('ATS error:', err);
    } finally {
      setEvaluatingPreview(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !job || !cvText.trim()) return;

    setApplying(true);
    try {
      const appId = await applicationService.applyForJob({
        jobId: job.id,
        jobTitle: job.title,
        candidateUid: currentUser.uid,
        candidateName: candidateName || currentUser.displayName || 'Candidate',
        candidateEmail: candidateEmail || currentUser.email || '',
        cvText: cvText.trim(),
        requirements: job.requirements || []
      });

      const apps = await applicationService.getApplicationsForCandidate(currentUser.uid);
      const myApp = apps.find(a => a.id === appId) || null;
      setExistingApplication(myApp);
      setShowApplyModal(false);
    } catch (err: any) {
      console.error('Application submission error:', err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      try {
        setLoading(true);
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          setJob({
            id: jobSnap.id,
            ...jobSnap.data() as Omit<JobPosting, 'id'>
          });

          if (currentUser) {
            const apps = await applicationService.getApplicationsForCandidate(currentUser.uid);
            const myApp = apps.find(a => a.jobId === jobId);
            if (myApp) setExistingApplication(myApp);
          }
        } else {
          setError('Job posting not found');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, currentUser]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-olive-700 border-t-transparent" />
          <p className="text-xs font-mono text-slate-600 font-semibold">Loading Job Requisition Details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="bg-white border-2 border-olive-300 rounded-xl p-8 text-center space-y-3 shadow-sm">
          <p className="text-base font-bold text-slate-900">Requisition Not Found</p>
          <p className="text-xs text-slate-600">{error || 'This job posting may have been closed or archived.'}</p>
          <button onClick={() => navigate('/jobseeker/dashboard')} className="bg-olive-800 hover:bg-olive-900 text-white font-bold py-2 px-5 rounded-lg text-xs transition-colors">
            Return to Career Portal
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'HIRICA Portal', href: '/jobseeker/dashboard' },
        { label: job.title }
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* REQUISITION HEADER HERO */}
        <div className="card-enterprise p-6 border-olive-300 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-olive-100 text-olive-900 border border-olive-300">
                {job.type}
              </span>
              {job.seniority && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-olive-50 text-olive-800 border border-olive-300">
                  {job.seniority}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-800">{job.company || 'Enterprise Corp'}</strong> • {job.location || 'Remote'}
              {job.salaryRange && ` • Compensation: ${job.salaryRange}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {existingApplication ? (() => {
              const isAssessmentDone = (existingApplication as any).assessmentScore !== undefined || (existingApplication as any).assessmentCompleted === true || existingApplication.status === 'assessment_completed';
              return (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold border ${
                    existingApplication.status === 'selected'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : isAssessmentDone
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : existingApplication.status === 'approved_for_assessment'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {existingApplication.status === 'selected' && 'Selected / Offer'}
                    {isAssessmentDone && existingApplication.status !== 'selected' && `Assessment Completed (${(existingApplication as any).assessmentScore ?? 85}%)`}
                    {!isAssessmentDone && existingApplication.status === 'approved_for_assessment' && 'Assessment Unlocked'}
                    {existingApplication.status === 'pending_review' && 'Application Submitted'}
                  </span>

                  {isAssessmentDone ? (
                    <button
                      onClick={() => navigate(`/results/${existingApplication.assessmentId || existingApplication.id}`)}
                      className="btn-enterprise bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 !py-2 !px-4 text-xs font-bold"
                    >
                      View Results ({(existingApplication as any).assessmentScore ?? 85}%) 📄
                    </button>
                  ) : existingApplication.status === 'approved_for_assessment' ? (
                    <button
                      onClick={() => navigate(`/assessment/${existingApplication.assessmentId || existingApplication.id}`)}
                      className="btn-brand !py-2 !px-4 text-xs font-bold"
                    >
                      Take Assessment ⚡
                    </button>
                  ) : null}
                </div>
              );
            })() : (
              <button
                onClick={() => setShowApplyModal(true)}
                className="btn-brand !py-2.5 !px-6 text-xs font-bold shadow-md"
              >
                Apply & Upload CV 📄
              </button>
            )}
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Job Body (8 Cols) */}
          <div className="lg:col-span-8 card-enterprise p-6 space-y-6 border-olive-300 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-olive-100 pb-2">
                Role Overview & Mission
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-olive-100 pb-2">
                  Key Responsibilities
                </h2>
                <ul className="space-y-2 text-xs text-slate-700">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-olive-700 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-olive-100 pb-2">
                  Required Qualifications & Skills
                </h2>
                <ul className="space-y-2 text-xs text-slate-700">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar Overview (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="card-enterprise p-5 space-y-4 border-olive-300 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-olive-200 pb-2 font-mono">
                Role Snapshot
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Department</span>
                  <span className="text-slate-900 font-bold">{job.department || 'Engineering'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Location Type</span>
                  <span className="text-slate-900 font-bold">{job.location || 'Remote'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Evaluation Stages</span>
                  <span className="text-slate-900 font-medium">ATS • Proctored Test • AI Interview</span>
                </div>
              </div>
            </div>

            {/* Application Status summary if applied */}
            {existingApplication && (
              <div className="card-enterprise p-5 space-y-2 border-olive-300 bg-olive-50/60 shadow-sm">
                <span className="text-[10px] font-mono text-olive-800 uppercase font-bold">My Application Active</span>
                <p className="text-xs text-slate-800">
                  ATS Match Score: <strong className="text-olive-900 font-bold">{existingApplication.aiMatchScore}%</strong>
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {existingApplication.aiSummary}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* APPLY MODAL */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-olive-300 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-olive-200 flex justify-between items-center bg-olive-50/60">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Apply for: {job.title}</h3>
                  <p className="text-xs text-slate-600">Upload your CV (PDF, DOCX, TXT) for instant ATS evaluation.</p>
                </div>
                <button onClick={() => setShowApplyModal(false)} className="text-slate-500 hover:text-slate-900 font-bold p-1">✕</button>
              </div>

              <form onSubmit={handleSubmitApplication} className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-olive-600 focus:ring-1 focus:ring-olive-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-olive-600 focus:ring-1 focus:ring-olive-600"
                    />
                  </div>
                </div>

                {/* Upload Zone */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Resume / CV File</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-olive-300 hover:border-olive-600 rounded-xl p-6 text-center cursor-pointer transition-colors bg-olive-50/40"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                      }}
                    />
                    <div className="text-2xl mb-1">📄</div>
                    <p className="text-xs font-semibold text-slate-900">
                      {selectedFileName ? selectedFileName : 'Click to upload resume (PDF, DOCX, TXT)'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">PyMuPDF will automatically extract structured skills & evidence.</p>
                  </div>
                </div>

                {parsingFile && (
                  <div className="text-xs text-olive-800 font-mono font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-olive-600 animate-ping" />
                    Extracting structured resume text with backend parser...
                  </div>
                )}

                {evaluatingPreview && (
                  <div className="text-xs text-emerald-800 font-mono font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    Computing semantic ATS qualification match against role requirements...
                  </div>
                )}

                {/* Parsed CV text */}
                {cvText && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Extracted CV Text</label>
                      <button
                        type="button"
                        onClick={handleRunManualATS}
                        className="text-[10px] font-semibold text-olive-800 hover:text-olive-900"
                      >
                        Re-run ATS Evaluation ➔
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:border-olive-600 outline-none"
                    />
                  </div>
                )}

                {/* ATS Preview Card */}
                {atsPreview && (
                  <div className="p-4 rounded-xl bg-olive-50 border border-olive-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Instant ATS Match Preview</span>
                      <span className="text-sm font-bold font-mono text-olive-800">{atsPreview.match_score}% Match</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{atsPreview.summary}</p>
                    {atsPreview.matched_skills && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {atsPreview.matched_skills.map((s: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-300">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="btn-secondary-dark"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying || !cvText.trim()}
                    className="btn-brand"
                  >
                    {applying ? 'Submitting Application...' : 'Confirm Application Submission ➔'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobDetail;