import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface TourStep {
  title: string;
  badge: string;
  targetRole: 'recruiter' | 'candidate' | 'all';
  description: string;
  keyFeatures: string[];
  actionLabel?: string;
  actionPath?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to HIRICA 2.0',
    badge: 'Overview',
    targetRole: 'all',
    description: 'HIRICA 2.0 is an Autonomous Multi-Agent AI Recruitment Intelligence Platform that coordinates hiring from job creation to final offer decisions.',
    keyFeatures: [
      'Evidence-based candidate evaluation using 8 autonomous AI agents',
      'Dual portal: Recruiter Workspace & Candidate Career Portal',
      'Privacy-first on-device proctoring (Zero video upload to cloud)'
    ]
  },
  {
    title: '1. AI-Powered Job Studio',
    badge: 'Recruiter Step 1',
    targetRole: 'recruiter',
    description: 'Recruiters enter basic role requirements, and Groq LLaMA-3.1 automatically writes comprehensive job descriptions and competency weights.',
    keyFeatures: [
      'Instant JD generation with role mission & responsibilities',
      'Pre-publish hiring simulation predicting candidate drop-offs',
      'Configurable proctoring rules (tab switch and copy-paste prevention)'
    ],
    actionLabel: 'Open Job Studio',
    actionPath: '/job-posting'
  },
  {
    title: '2. Candidate Application & Resume Parsing',
    badge: 'Candidate Step',
    targetRole: 'candidate',
    description: 'Candidates browse published requisitions, upload PDF or DOCX resumes, and receive instant semantic ATS matching.',
    keyFeatures: [
      'PyMuPDF extracts raw text and technical project history',
      'ATS matches verified resume evidence against competencies',
      'Displays matched skills, missing skills, and qualification summary'
    ],
    actionLabel: 'View Candidate Portal',
    actionPath: '/jobseeker/dashboard'
  },
  {
    title: '3. Proctored Competency Assessment',
    badge: 'Evaluation',
    targetRole: 'all',
    description: 'Candidates take timed competency assessments covering multiple-choice, written architecture, and algorithm coding questions.',
    keyFeatures: [
      'Anti-cheat listeners capture tab switches and window blur events',
      'MediaPipe runs client-side in the browser to detect face presence',
      'Decoupled integrity scoring prevents auto-fails from camera glitches'
    ]
  },
  {
    title: '4. Adaptive AI Technical Interview',
    badge: 'AI Dialogue',
    targetRole: 'all',
    description: 'A conversational AI interviewer engages candidates in multi-turn technical dialogues probing resume skill gaps.',
    keyFeatures: [
      'Dynamic follow-up probes tailored to candidate answers',
      'Turn-by-turn scoring and reasoning feedback',
      'Full conversation transcripts archived into candidate record'
    ]
  },
  {
    title: '5. 8-Agent Multi-Agent Pipeline',
    badge: 'AI Core',
    targetRole: 'recruiter',
    description: 'Eight specialized autonomous agents synthesize candidate evidence instead of relying on a monolithic black-box prompt.',
    keyFeatures: [
      'Job, Resume, Assessment, and Interview Agents analyze technical data',
      'Integrity Agent computes a 0-100% Trust Index',
      'NIST Fairness Auditor validates zero demographic proxy bias',
      'Explainable Decision Agent recommends: Strong Hire, Interview, or Reject'
    ]
  },
  {
    title: '6. Candidate Dossier & Human Recruiter Decision',
    badge: 'Final Step',
    targetRole: 'recruiter',
    description: 'Recruiters review all signals in an auditable Candidate Dossier, inspect interactive competency graphs, and prepare formal offers.',
    keyFeatures: [
      'Single auditable view of ATS, test, interview, and fairness signals',
      'Human-in-the-loop: Recruiter retains 100% authority over final decisions',
      'Offers (salary, start date, equity) persist in Cloud Firestore'
    ],
    actionLabel: 'Open Recruiter Workspace',
    actionPath: '/recruiter/dashboard'
  }
];

export const GuidedTourModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleNavigate = (path?: string) => {
    if (path) {
      onClose();
      navigate(path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-2 border-olive-300 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-olive-200 bg-olive-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-olive-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentStepIndex + 1}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-olive-800 font-bold block">
                HIRICA Guided Tour • Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{currentStep.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 font-bold p-1 text-sm rounded hover:bg-olive-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-olive-100 text-olive-900 border border-olive-300">
              {currentStep.badge}
            </span>
            <span className="text-xs text-slate-500 font-medium">Interactive Walkthrough</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {currentStep.description}
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-olive-200 space-y-2">
            <span className="text-[11px] font-mono font-bold text-slate-900 uppercase block">
              Key Capabilities:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {currentStep.keyFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-olive-700 font-bold mt-0.5">✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-olive-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'bg-olive-800 w-5'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep.actionLabel && currentStep.actionPath && (
              <button
                onClick={() => handleNavigate(currentStep.actionPath)}
                className="px-3 py-1.5 rounded-lg border border-olive-300 text-olive-900 hover:bg-olive-100 text-xs font-semibold transition-colors"
              >
                {currentStep.actionLabel} ➔
              </button>
            )}

            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-olive-800 hover:bg-olive-900 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step ➔'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
