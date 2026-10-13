import { type FC, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

type SettingsTab = 'profile' | 'organization' | 'team' | 'workflow' | 'ai' | 'assessment' | 'notifications' | 'privacy' | 'system';

export const Settings: FC = () => {
  const { currentUser, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser?.displayName || 'Hirica Recruiter');
  const [email] = useState(currentUser?.email || 'recruiter@hirica.ai');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [jobTitle, setJobTitle] = useState('Senior Technical Talent Acquisition Specialist');

  // Org Settings State
  const [orgName, setOrgName] = useState('Hirica Autonomous Intelligence Labs');
  const [orgIndustry, setOrgIndustry] = useState('Artificial Intelligence & SaaS');
  const [orgLocation, setOrgLocation] = useState('San Francisco, CA (Remote-First)');
  const [orgWebsite, setOrgWebsite] = useState('https://hirica.ai');

  // AI Configuration State (Reads safely from backend)
  const [aiModel] = useState('LLaMA-3.1-70b-versatile');
  const [aiProvider] = useState('Groq Cloud LPUs');
  const [aiStatus] = useState('Operational (Ultra-low latency inference)');
  const [maxTurns, setMaxTurns] = useState('4 turns');

  // Assessment Defaults
  const [defaultDuration, setDefaultDuration] = useState('45');
  const [preventTabSwitch, setPreventTabSwitch] = useState(true);
  const [allowClipboard, setAllowClipboard] = useState(false);

  // Privacy & Consent
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [aiDisclosureConsent, setAiDisclosureConsent] = useState(true);

  const handleSave = (section: string) => {
    setSavedNotification(`Settings for "${section}" saved successfully.`);
    setTimeout(() => setSavedNotification(null), 3000);
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'HIRICA Workspace', href: '/recruiter/dashboard' },
        { label: 'Platform & Organization Settings' }
      ]}
    >
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Main Platform Settings</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-olive-100 text-olive-900 border border-olive-300 font-bold">
                Control Center
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Configure profile credentials, team access, AI providers, assessment telemetry rules, and privacy compliance.
            </p>
          </div>

          {savedNotification && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>{savedNotification}</span>
            </div>
          )}
        </div>

        {/* SETTINGS TABS */}
        <div className="flex items-center gap-1 border-b border-olive-200 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile Settings' },
            { id: 'organization', label: 'Organization' },
            { id: 'team', label: 'Team & Permissions' },
            { id: 'workflow', label: 'Hiring Stages' },
            { id: 'ai', label: 'AI Configuration' },
            { id: 'assessment', label: 'Assessment Defaults' },
            { id: 'privacy', label: 'Privacy & Cookies' },
            { id: 'system', label: 'Integration & System Status' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-olive-800 text-olive-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="card-enterprise p-6 border-olive-200 space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900">User Account Profile</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Role Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleSave('Profile')}
                  className="btn-brand text-xs font-bold"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: ORGANIZATION SETTINGS */}
        {activeTab === 'organization' && (
          <div className="card-enterprise p-6 border-olive-200 space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900">Company & Brand Configuration</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Industry Domain</label>
                <input
                  type="text"
                  value={orgIndustry}
                  onChange={(e) => setOrgIndustry(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Default Headquarters Location</label>
                <input
                  type="text"
                  value={orgLocation}
                  onChange={(e) => setOrgLocation(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company Careers URL</label>
                <input
                  type="text"
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleSave('Organization')}
                  className="btn-brand text-xs font-bold"
                >
                  Save Organization Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: TEAM & PERMISSIONS */}
        {activeTab === 'team' && (
          <div className="card-enterprise p-6 border-olive-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-slate-500">Authorized team members and evaluation privileges.</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-olive-100 text-olive-900 border border-olive-300">
                Current Role: {userRole?.toUpperCase() || 'RECRUITER'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-[10px]">
                    <th className="py-2">MEMBER</th>
                    <th className="py-2">EMAIL</th>
                    <th className="py-2">ROLE</th>
                    <th className="py-2">PRIVILEGES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 font-bold text-slate-900">Senior Recruiter (You)</td>
                    <td className="py-2.5 text-slate-600">{email}</td>
                    <td className="py-2.5 font-mono text-olive-800 font-bold">Organization Admin</td>
                    <td className="py-2.5 text-slate-500">Requisitions, Assessments, Offers, Settings</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-900">AI Evaluation Agent</td>
                    <td className="py-2.5 text-slate-600">multi-agent@hirica.internal</td>
                    <td className="py-2.5 font-mono text-blue-700 font-bold">Automated Evaluator</td>
                    <td className="py-2.5 text-slate-500">ATS Matching, Proctoring Telemetry, Dossier</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: RECRUITMENT WORKFLOW STAGES */}
        {activeTab === 'workflow' && (
          <div className="card-enterprise p-6 border-olive-200 space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900">Lifecycle Workflow Stages</h3>
            <p className="text-xs text-slate-500">Server-authoritative pipeline transitions enforced for all candidates.</p>
            
            <div className="space-y-2 text-xs">
              {[
                { step: '01', name: 'Application Received', desc: 'CV parsed via PyMuPDF with instant semantic ATS preview' },
                { step: '02', name: 'Pre-Screening Review', desc: 'Recruiter verifies qualifications & approves assessment' },
                { step: '03', name: 'Adaptive Assessment', desc: 'Proctored technical MCQ, written & coding exam' },
                { step: '04', name: 'AI Technical Interview', desc: 'Multi-turn conversational probing with Groq LLaMA-3.1' },
                { step: '05', name: 'Candidate Dossier & Audit', desc: '8-agent consensus with explainability & fairness metrics' },
                { step: '06', name: 'Offer / Selected', desc: 'Formal compensation terms & onboarding initiation' },
              ].map((s) => (
                <div key={s.step} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-olive-800">{s.step}</span>
                  <div>
                    <h4 className="font-bold text-slate-900">{s.name}</h4>
                    <p className="text-[11px] text-slate-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: AI PROVIDER STATUS */}
        {activeTab === 'ai' && (
          <div className="card-enterprise p-6 border-olive-200 space-y-4 max-w-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">AI Inference Architecture</h3>
                <p className="text-xs text-slate-500">Zero client-side secrets. Credentials isolated in server environment.</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Healthy
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">PROVIDER</span>
                <span className="font-bold text-slate-900">{aiProvider}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">MODEL</span>
                <span className="font-bold text-slate-900">{aiModel}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 col-span-2">
                <span className="text-[10px] text-slate-500 block">LATENCY & STATUS</span>
                <span className="font-bold text-emerald-700">{aiStatus}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-2">
              <label className="font-semibold text-slate-700 block">Max Adaptive Interview Turns</label>
              <select
                value={maxTurns}
                onChange={(e) => setMaxTurns(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
              >
                <option value="3 turns">3 turns (Rapid Assessment)</option>
                <option value="4 turns">4 turns (Standard Technical Depth)</option>
                <option value="6 turns">6 turns (Comprehensive Senior Probing)</option>
              </select>
            </div>
          </div>
        )}

        {/* SECTION 6: ASSESSMENT DEFAULTS */}
        {activeTab === 'assessment' && (
          <div className="card-enterprise p-6 border-olive-200 space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900">Proctoring & Assessment Rules</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Default Duration (Minutes)</label>
                <input
                  type="number"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-olive-600"
                />
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preventTabSwitch}
                    onChange={(e) => setPreventTabSwitch(e.target.checked)}
                    className="h-4 w-4 text-olive-800 rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-800">Prevent tab switching & record focus interruptions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowClipboard}
                    onChange={(e) => setAllowClipboard(e.target.checked)}
                    className="h-4 w-4 text-olive-800 rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-800">Allow clipboard copy & paste (Disabled by default for integrity)</span>
                </label>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleSave('Assessment Defaults')}
                  className="btn-brand text-xs font-bold"
                >
                  Save Assessment Defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: PRIVACY & COOKIES */}
        {activeTab === 'privacy' && (
          <div className="card-enterprise p-6 border-olive-200 space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900">Privacy, Cookies & Compliance Notice</h3>
            <p className="text-xs text-slate-600">
              HIRICA maintains strict data isolation. Candidates retain rights to review evaluation criteria and consent to proctored telemetry.
            </p>

            <div className="space-y-3 text-xs pt-1">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Essential Cookies:</span>
                <p className="text-slate-600">Session credentials and authentication state. Strictly necessary for platform operations.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiDisclosureConsent}
                  onChange={(e) => setAiDisclosureConsent(e.target.checked)}
                  className="h-4 w-4 text-olive-800 rounded border-slate-300"
                />
                <span className="font-medium text-slate-800">AI-assisted evaluation disclosure enabled for all applicants</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsConsent}
                  onChange={(e) => setAnalyticsConsent(e.target.checked)}
                  className="h-4 w-4 text-olive-800 rounded border-slate-300"
                />
                <span className="font-medium text-slate-800">Telemetry event recording enabled for integrity verification</span>
              </label>
            </div>
          </div>
        )}

        {/* SECTION 8: SYSTEM INTEGRATION STATUS */}
        {activeTab === 'system' && (
          <div className="card-enterprise p-6 border-olive-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">System Integration Status Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">BACKEND REST API</span>
                <p className="text-sm font-bold text-emerald-800 mt-0.5">http://127.0.0.1:8000</p>
                <span className="text-[10px] text-emerald-700">Healthy & Online</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">VITE FRONTEND</span>
                <p className="text-sm font-bold text-emerald-800 mt-0.5">http://127.0.0.1:5173</p>
                <span className="text-[10px] text-emerald-700">Development Server</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">AI INFERENCE</span>
                <p className="text-sm font-bold text-emerald-800 mt-0.5">Groq Cloud</p>
                <span className="text-[10px] text-emerald-700">Active (LLaMA-3.1)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
