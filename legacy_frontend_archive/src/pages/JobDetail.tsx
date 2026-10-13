import { type FC, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { assessmentService, type JobPosting as AssessmentJobPosting } from '../services/assessmentService';
import { applicationService, Application } from '../services/applicationService';
import axios from 'axios';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  createdAt: Timestamp;
  assessmentType: string[];
  difficulty: {
    beginner: boolean;
    intermediate: boolean;
    advanced: boolean;
  };
  assessmentRules: {
    timeLimit: number;
    allowCopyPaste: boolean;
    allowAITools: boolean;
    preventTabSwitching: boolean;
    preventMinimization: boolean;
    trackIP: boolean;
  };
}

const JobDetail: FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  // Application & CV state
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [cvText, setCvText] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState<Application | null>(null);

  // File upload and ATS preview state
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [atsPreview, setAtsPreview] = useState<any | null>(null);
  const [evaluatingPreview, setEvaluatingPreview] = useState(false);
  const [uploadMode, setUploadMode] = useState<'upload' | 'paste'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setSelectedFileName(file.name);
    setParsingFile(true);
    setAtsPreview(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('http://127.0.0.1:8000/api/parse-cv-file', formData, {
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
      alert(err.response?.data?.detail || 'Failed to extract text from CV file. Please try pasting manually.');
    } finally {
      setParsingFile(false);
    }
  };

  const runAtsPreview = async () => {
    if (!cvText.trim() || !job?.requirements?.length) return;
    setEvaluatingPreview(true);
    try {
      const preview = await applicationService.evaluateResume(job.title, job.requirements, cvText);
      setAtsPreview(preview);
    } catch (err) {
      console.warn('ATS preview error:', err);
    } finally {
      setEvaluatingPreview(false);
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

          // Check if candidate has already applied
          if (currentUser) {
            const apps = await applicationService.getApplicationsForCandidate(currentUser.uid);
            const myApp = apps.find(a => a.jobId === jobId);
            if (myApp) {
              setExistingApplication(myApp);
            }
          }
        } else {
          setError('Job posting not found');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [jobId, currentUser]);

  const handleApplyWithCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !currentUser) return;
    if (!cvText.trim()) {
      alert('Please enter or paste your CV / Resume summary.');
      return;
    }

    try {
      setApplying(true);
      const appId = await applicationService.applyForJob({
        jobId: job.id,
        jobTitle: job.title,
        candidateUid: currentUser.uid,
        candidateName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Candidate',
        candidateEmail: currentUser.email || '',
        cvText: cvText,
        requirements: job.requirements || []
      });

      // Refetch saved application
      const apps = await applicationService.getApplicationsForCandidate(currentUser.uid);
      const savedApp = apps.find(a => a.id === appId) || null;
      setExistingApplication(savedApp);
      setApplicationSuccess(savedApp);
      setShowApplyModal(false);
    } catch (err) {
      console.error('Error applying for job:', err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };
  
  const startAssessment = async () => {
    if (!currentUser || !job) return;
    
    try {
      setGeneratingAssessment(true);
      setAssessmentError(null);
      
      const assessmentJob: AssessmentJobPosting = {
        id: job.id,
        title: job.title || 'Software Role',
        company: job.company || 'Company',
        location: job.location || 'Remote',
        description: job.description || '',
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        assessmentRules: job.assessmentRules || {
          timeLimit: 60,
          allowCopyPaste: false,
          allowAITools: false,
          preventTabSwitching: true,
          preventMinimization: true,
          trackIP: true
        }
      };
      
      const assessment = await assessmentService.generateAssessment(assessmentJob);
      
      if (assessment && assessment.id) {
        // Link assessmentId to application if exists
        if (existingApplication) {
          await applicationService.updateApplicationStatus(existingApplication.id, existingApplication.status, assessment.id);
        }
        navigate(`/assessment/${assessment.id}`);
      } else {
        throw new Error('Assessment generation failed: No assessment ID received');
      }
    } catch (err: any) {
      console.error('Error generating assessment:', err);
      setAssessmentError(err.message || 'Failed to generate assessment. Please try again later.');
    } finally {
      setGeneratingAssessment(false);
    }
  };
  
  // Format date
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Recently';
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date(timestamp as any).toLocaleDateString();
  };
  
  // Get assessment time estimate
  const getTimeEstimate = () => {
    if (!job || !job.assessmentRules) return '30 minutes';
    
    const minutes = job.assessmentRules.timeLimit || 30;
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minutes` : ''}`;
    }
  };
  
  // Generate difficulty badges
  const getDifficultyBadges = () => {
    if (!job || !job.difficulty) return <span className="text-gray-600 text-xs">Standard</span>;
    
    const badges = [];
    
    if (job.difficulty.beginner) {
      badges.push(
        <span key="beginner" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
          Beginner
        </span>
      );
    }
    
    if (job.difficulty.intermediate) {
      badges.push(
        <span key="intermediate" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
          Intermediate
        </span>
      );
    }
    
    if (job.difficulty.advanced) {
      badges.push(
        <span key="advanced" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
          Advanced
        </span>
      );
    }
    
    return badges;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Job not found'}</h2>
            <p className="text-gray-600 mb-6">The job posting you're looking for doesn't exist or may have been removed.</p>
            <Link
              to="/jobseeker/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to Job Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {assessmentError && (
            <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>{assessmentError}</span>
              </div>
              <button onClick={() => setAssessmentError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
            </div>
          )}

          {/* Job Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
                <p className="text-lg text-gray-600 mb-2">{job.company} • {job.location}</p>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {job.type}
                  </span>
                  <span className="text-sm text-gray-500">Posted on {formatDate(job.createdAt)}</span>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex flex-col items-end gap-2">
                {userRole === 'recruiter' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                    Recruiter View
                  </span>
                ) : existingApplication ? (
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      existingApplication.status === 'selected'
                        ? 'bg-green-100 text-green-800'
                        : existingApplication.status === 'approved_for_assessment'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {existingApplication.status === 'selected' && '🎉 Shortlisted / Selected'}
                      {existingApplication.status === 'approved_for_assessment' && '✅ Assessment Unlocked'}
                      {existingApplication.status === 'pending_review' && '⏳ Application Under Recruiter Review'}
                      {existingApplication.status === 'rejected' && 'Application Not Selected'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 font-semibold">
                      AI Resume Fit Score: <span className="text-primary-600">{existingApplication.aiMatchScore}%</span>
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    📄 Apply & Upload CV
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Job Description */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job Description</h2>
            <div className="prose max-w-none text-gray-700">
              {(job.description || '').split('\n').map((paragraph, index) => (
                paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
              ))}
            </div>
          </div>
          
          {/* Requirements */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Requirements</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {(job.requirements || []).map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
          </div>

          {/* Application Status Banner / Assessment Button */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Application & Assessment Status</h2>

            {!existingApplication && userRole !== 'recruiter' && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-800">
                      Please click <strong>"Apply & Upload CV"</strong> above to submit your resume. Our AI system will evaluate your match score for the recruiter.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {existingApplication && existingApplication.status === 'pending_review' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-yellow-800">Application Submitted!</h3>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your CV match score is <strong>{existingApplication.aiMatchScore}%</strong>. The recruiter is currently reviewing candidate profiles. Once approved, your assessment test will unlock automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {existingApplication && (existingApplication.status === 'approved_for_assessment' || userRole === 'recruiter') && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-green-800">✅ Assessment Approved & Unlocked</h3>
                    <p className="text-xs text-green-700 mt-1">
                      You are approved to take the AI technical and aptitude assessment for this role.
                    </p>
                  </div>
                  <button
                    onClick={startAssessment}
                    disabled={generatingAssessment}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-75"
                  >
                    {generatingAssessment ? 'Preparing Assessment...' : 'Start Assessment Now'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Difficulty Level</h3>
                  <div className="mt-2 flex">{getDifficultyBadges()}</div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Time Limit</h3>
                  <div className="mt-2 text-gray-700">{getTimeEstimate()}</div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Anti-Cheating Rules</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <p>• Copy-Paste: {job.assessmentRules?.allowCopyPaste ? 'Allowed' : 'Not Allowed'}</p>
                    <p>• AI Assistance: {job.assessmentRules?.allowAITools ? 'Allowed' : 'Not Allowed'}</p>
                    <p>• Tab Switch Monitoring: {job.assessmentRules?.preventTabSwitching ? 'Active' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CV Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Apply for {job.title}</h3>
                <p className="text-xs text-gray-500">Upload your CV to have our ATS engine extract skills & compute your match score.</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600 text-lg p-1">✕</button>
            </div>

            {/* Mode Switcher */}
            <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setUploadMode('upload')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  uploadMode === 'upload' ? 'bg-white shadow text-[#0F4C3A]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📄 Upload CV File (PDF / DOCX / TXT)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('paste')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  uploadMode === 'paste' ? 'bg-white shadow text-[#0F4C3A]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✍️ Paste Text Manually
              </button>
            </div>

            <form onSubmit={handleApplyWithCV} className="space-y-4">
              {uploadMode === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-6 text-center cursor-pointer transition-all"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs border border-emerald-200">
                      {parsingFile ? (
                        <div className="w-6 h-6 border-2 border-[#0F4C3A] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span className="text-2xl">📁</span>
                      )}
                    </div>

                    {parsingFile ? (
                      <div>
                        <p className="text-sm font-bold text-[#0F4C3A]">Reading CV & Extracting Text with ATS...</p>
                        <p className="text-xs text-gray-500 mt-1">Parsing PDF / DOCX contents...</p>
                      </div>
                    ) : selectedFileName ? (
                      <div>
                        <p className="text-sm font-bold text-gray-800">Selected: <span className="text-[#0F4C3A]">{selectedFileName}</span></p>
                        <p className="text-xs text-emerald-700 mt-1 font-semibold">✓ Text successfully extracted through ATS parser</p>
                        <p className="text-[11px] text-gray-400 mt-1">Click to select a different CV file</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-bold text-gray-800">Click to upload or drag & drop your CV</p>
                        <p className="text-xs text-gray-500 mt-1">Supports PDF (.pdf), Word (.docx), or Text (.txt)</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Extracted CV Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {uploadMode === 'upload' ? 'Extracted CV Text (Review / Edit):' : 'Paste Your CV / Resume Summary *'}
                  </label>
                  {cvText && (
                    <button
                      type="button"
                      onClick={runAtsPreview}
                      disabled={evaluatingPreview}
                      className="text-[11px] text-[#0F4C3A] font-bold hover:underline"
                    >
                      {evaluatingPreview ? 'Analyzing Match...' : '⚡ Re-analyze Match'}
                    </button>
                  )}
                </div>

                <textarea
                  rows={uploadMode === 'upload' ? 4 : 8}
                  required
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your resume, skills, previous experience, or education..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-xs focus:ring-[#0F4C3A] focus:border-[#0F4C3A] text-xs font-mono"
                />
              </div>

              {/* ATS Instant Match Preview */}
              {evaluatingPreview && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-800 font-medium">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Evaluating your CV contents against role requirements via ATS engine...
                </div>
              )}

              {atsPreview && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Instant ATS Evaluation Match:</span>
                      <h4 className="text-sm font-bold text-gray-900">{atsPreview.recommendation}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">ATS Fit Score</span>
                      <span className="text-2xl font-black text-[#0F4C3A]">{atsPreview.match_score || atsPreview.ats_score}%</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">{atsPreview.summary}</p>

                  {/* Matched Skills */}
                  {atsPreview.matched_skills && atsPreview.matched_skills.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block mb-1">
                        ✓ Matched Core Competencies ({atsPreview.matched_skills.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {atsPreview.matched_skills.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {atsPreview.missing_skills && atsPreview.missing_skills.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide block mb-1">
                        ⚠ Identified Competency Gaps:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {atsPreview.missing_skills.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                            ⚠ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying || parsingFile || !cvText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0F4C3A] hover:bg-[#083327] disabled:opacity-50 transition-all shadow-xs"
                >
                  {applying ? 'Submitting & Evaluating...' : 'Confirm & Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Result Notification Modal */}
      {applicationSuccess && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
            <div className="bg-gray-50 p-4 rounded-lg my-4 text-left border border-gray-200">
              <p className="text-sm font-semibold text-gray-700">
                AI Resume Match Score: <span className="text-2xl font-bold text-primary-600 ml-2">{applicationSuccess.aiMatchScore}%</span>
              </p>
              <p className="text-xs text-gray-600 mt-2">{applicationSuccess.aiSummary}</p>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Your application has been sent to the recruiter. Once the recruiter approves your profile, your technical assessment will unlock!
            </p>
            <button
              onClick={() => setApplicationSuccess(null)}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail; 