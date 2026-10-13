import { type FC } from 'react';
import { Link } from 'react-router-dom';

const Landing: FC = () => {
  return (
    <div className="min-h-screen bg-architectural-grid text-slate-800 flex flex-col selection:bg-olive-800 selection:text-white relative overflow-x-hidden">
      {/* CAD BLUEPRINT GEOMETRIC ACCENTS IN LOGO SECONDARY OLIVE (#3F471E) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Subtle radial arcs and dashed trajectory lines */}
        <svg className="absolute -top-32 -left-32 w-[900px] h-[900px] opacity-40 text-olive-800/40" viewBox="0 0 900 900" fill="none">
          <circle cx="200" cy="450" r="180" stroke="#3F471E" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
          <circle cx="200" cy="450" r="320" stroke="#3F471E" strokeWidth="1" opacity="0.4" />
          <circle cx="200" cy="450" r="480" stroke="#3F471E" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.3" />
          <line x1="0" y1="450" x2="900" y2="450" stroke="#3F471E" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.35" />
          <line x1="50" y1="200" x2="850" y2="600" stroke="#3F471E" strokeWidth="0.8" strokeDasharray="5 5" opacity="0.4" />
          <text x="310" y="380" fill="#3F471E" fontSize="10" fontFamily="monospace" letterSpacing="1" opacity="0.85">+ 112.5m</text>
          <text x="490" y="290" fill="#3F471E" fontSize="9" fontFamily="monospace" letterSpacing="1" opacity="0.75">SEC-01 // R-480</text>
          <circle cx="200" cy="450" r="4" fill="#3F471E" />
          <path d="M190 450h20M200 440v20" stroke="#3F471E" strokeWidth="1" />
        </svg>

        <svg className="absolute top-1/2 -right-40 w-[800px] h-[800px] opacity-35 text-olive-800/30" viewBox="0 0 800 800" fill="none">
          <circle cx="600" cy="400" r="260" stroke="#3F471E" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          <circle cx="600" cy="400" r="420" stroke="#3F471E" strokeWidth="0.8" opacity="0.25" />
          <line x1="100" y1="150" x2="700" y2="650" stroke="#3F471E" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
          <text x="420" y="340" fill="#3F471E" fontSize="9" fontFamily="monospace" opacity="0.75">+ 240.8m LAT-SYS</text>
        </svg>
      </div>

      {/* TOP NAVIGATION BAR WITH USER'S OFFICIAL LOGO */}
      <header className="border-b border-olive-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            {/* CLEAN TRANSPARENT LOGO WITHOUT BLACK CONTAINER */}
            <img 
              src="/hirica-logo-clean.png" 
              alt="HIRICA Logo" 
              className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/hirica-logo-transparent.png';
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900 tracking-tight">HIRICA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-olive-100 text-olive-900 border border-olive-300 font-bold">
                  AI-SYS
                </span>
              </div>
              <span className="text-[10px] text-slate-500 tracking-wider font-mono">Talent Acquisition Intelligence</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-600">
            <a href="#workflow" className="hover:text-olive-800 transition-colors">Lifecycle Workflow</a>
            <a href="#intelligence" className="hover:text-olive-800 transition-colors">8-Agent Architecture</a>
            <a href="#innovations" className="hover:text-olive-800 transition-colors">Innovations</a>
            <a href="#benchmarks" className="hover:text-olive-800 transition-colors">Benchmarks</a>
          </nav>

          <div className="flex items-center space-x-3 text-xs">
            <Link
              to="/recruiter/login"
              className="text-slate-700 hover:text-slate-900 px-3.5 py-1.5 rounded-lg border border-olive-300 hover:border-olive-500 bg-white shadow-subtle transition-all font-medium"
            >
              Recruiter Sign In
            </Link>
            <Link
              to="/jobseeker/login"
              className="btn-brand !py-1.5 !px-4"
            >
              Candidate Portal
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH USER'S SIGNATURE OUTLINE TYPOGRAPHY IN LOGO SECONDARY COLOR */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-olive-200/90 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Technical CAD telemetry pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-olive-50 border border-olive-300 text-olive-900 text-xs font-mono mb-6 shadow-subtle">
            <span className="w-2 h-2 rounded-full bg-olive-700 animate-pulse"></span>
            COLOR TOKEN: #3F471E // AUTONOMOUS MULTI-AGENT HIRING ENGINE
          </div>

          {/* SIGNATURE OUTLINE TITLE (Exact aesthetic of LET'S DESIGN. in Logo Olive Color) */}
          <div className="my-4">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-outline-olive tracking-tight select-none leading-none">
              LET'S HIRE.
            </h1>
            <p className="mt-3 text-sm sm:text-base font-mono uppercase tracking-widest text-olive-800 font-bold">
              Autonomous Multi-Agent Recruitment Intelligence
            </p>
          </div>

          <p className="mt-6 max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            HIRICA unifies structured job requisitions, anti-cheat proctored assessments, conversational adaptive AI interviews, and explainable multi-agent candidate ranking on a single auditable canvas.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/recruiter/login"
              className="w-full sm:w-auto btn-brand !py-3 !px-7 text-xs font-bold shadow-md hover:scale-[1.01] transition-transform"
            >
              Launch Recruiter Console ➔
            </Link>
            <Link
              to="/jobseeker/dashboard"
              className="w-full sm:w-auto btn-secondary-dark !py-3 !px-7 text-xs font-bold shadow-subtle hover:bg-olive-50"
            >
              Explore Open Requisitions 💼
            </Link>
          </div>

          {/* Subsystem Telemetry Badge Deck */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-white/95 border border-olive-200 shadow-subtle backdrop-blur-sm">
              <span className="text-[10px] font-mono text-olive-800 block font-bold">MULTI-AGENT CORE</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">8 Autonomous Agents</p>
              <span className="text-[10px] text-slate-500 font-mono">Job • Resume • Fairness</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/95 border border-olive-200 shadow-subtle backdrop-blur-sm">
              <span className="text-[10px] font-mono text-olive-800 block font-bold">LLM INFERENCE</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Groq LLaMA-3.1</p>
              <span className="text-[10px] text-olive-700 font-mono font-semibold">Adaptive Probing</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/95 border border-olive-200 shadow-subtle backdrop-blur-sm">
              <span className="text-[10px] font-mono text-olive-800 block font-bold">INTEGRITY TELEMETRY</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Behavioral Anti-Cheat</p>
              <span className="text-[10px] text-blue-700 font-mono font-semibold">Decoupled & Fair</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/95 border border-olive-200 shadow-subtle backdrop-blur-sm">
              <span className="text-[10px] font-mono text-olive-800 block font-bold">EXPLAINABILITY</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Competency Graph</p>
              <span className="text-[10px] text-amber-700 font-mono font-semibold">Evidence Traceable</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: END-TO-END RECRUITMENT LIFECYCLE */}
      <section id="workflow" className="py-20 border-b border-olive-200/90 bg-white/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-olive-800 font-bold">Unbroken Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
              One Connected Recruitment Ecosystem
            </h2>
            <p className="text-xs text-slate-600 mt-2">
              From structured job requisition to final offer rollout, every transition updates authoritative records in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-enterprise p-5 space-y-2 hover:border-olive-400 transition-colors">
              <span className="text-xs font-mono font-bold text-olive-800">01 • REQUISITION</span>
              <h3 className="text-sm font-bold text-slate-900">Guided Builder & Simulation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Recruiters define role competencies and proctored stages, verified via Pre-Publish Hiring Simulation.
              </p>
            </div>
            <div className="card-enterprise p-5 space-y-2 hover:border-olive-400 transition-colors">
              <span className="text-xs font-mono font-bold text-blue-700">02 • CANDIDATE ATS</span>
              <h3 className="text-sm font-bold text-slate-900">Semantic CV Evidence Match</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PyMuPDF & python-docx extract empirical claims, highlighting strengths and requirement gaps without black-box scoring.
              </p>
            </div>
            <div className="card-enterprise p-5 space-y-2 hover:border-olive-400 transition-colors">
              <span className="text-xs font-mono font-bold text-olive-700">03 • ASSESSMENT</span>
              <h3 className="text-sm font-bold text-slate-900">Proctored Code & MCQ Exams</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Auto-graded tests with client-side anti-cheat telemetry recording tab switches and paste events.
              </p>
            </div>
            <div className="card-enterprise p-5 space-y-2 hover:border-olive-400 transition-colors">
              <span className="text-xs font-mono font-bold text-amber-700">04 • AI INTERVIEW</span>
              <h3 className="text-sm font-bold text-slate-900">Conversational Adaptive Probing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adaptive AI interviewer probes unverified skills and architecture trade-offs in multi-turn voice-ready dialogue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 8-AGENT AI ARCHITECTURE */}
      <section id="intelligence" className="py-20 border-b border-olive-200/90 bg-architectural-grid relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-olive-800 font-bold">Scientific AIML Core</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
              8 Autonomous Agents Working in Orchestration
            </h2>
            <p className="text-xs text-slate-600 mt-2">
              Structured multi-agent pipeline replacing opaque, single-prompt models with verifiable, auditable AI agents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {[
              { name: 'Job Competency Agent', desc: 'Analyzes JD requirements into fine-grained evaluation rubrics.' },
              { name: 'Resume Evidence Agent', desc: 'Validates resume project claims against required competencies.' },
              { name: 'Assessment Coverage Agent', desc: 'Validates question pools for appropriate difficulty and coverage.' },
              { name: 'Interview Investigator Agent', desc: 'Dynamically synthesizes follow-up probes for unverified skills.' },
              { name: 'Integrity Agent', desc: 'Decouples behavioural telemetry from core technical competence.' },
              { name: 'Candidate Ranking Agent', desc: 'Applies transparent weighted mathematical ranking formulas.' },
              { name: 'Decision Agent', desc: 'Generates explainable hiring recommendations with concrete citations.' },
              { name: 'Fairness Auditor Agent', desc: 'Audits evaluation criteria for demographic proxy bias anomalies.' },
            ].map((agent, idx) => (
              <div key={idx} className="card-enterprise p-4 space-y-1.5 hover:border-olive-400 transition-colors">
                <span className="text-[10px] font-mono text-olive-800 font-bold">AGENT #{idx + 1}</span>
                <h4 className="text-xs font-bold text-slate-900">{agent.name}</h4>
                <p className="text-slate-600 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: CAPSTONE INNOVATIONS */}
      <section id="innovations" className="py-20 border-b border-olive-200/90 bg-white/70 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-olive-800 font-bold">Differentiated Features</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
              HIRICA Technical Innovations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-enterprise p-6 space-y-3">
              <span className="text-2xl">📊</span>
              <h3 className="text-sm font-bold text-slate-900">Competency Evidence Knowledge Graph</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects each required skill directly to resume bullets, code evaluations, and interview quotes with confidence scores.
              </p>
            </div>
            <div className="card-enterprise p-6 space-y-3">
              <span className="text-2xl">🛡️</span>
              <h3 className="text-sm font-bold text-slate-900">Pre-Publish Hiring Simulation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pre-flight audit checking whether the proposed hiring stages and assessment adequately cover required competencies.
              </p>
            </div>
            <div className="card-enterprise p-6 space-y-3">
              <span className="text-2xl">⚖️</span>
              <h3 className="text-sm font-bold text-slate-900">Algorithmic Fairness & Governance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Guarantees candidate ranking uses strictly job-related evidence, detecting potential demographic proxy bias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER WITH USER'S OFFICIAL LOGO */}
      <footer className="py-12 bg-white text-slate-600 text-xs border-t border-olive-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/hirica-logo-clean.png" 
              alt="HIRICA Logo" 
              className="h-6 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/hirica-logo-transparent.png';
              }}
            />
            <span className="font-bold text-slate-900">HIRICA 2.0</span>
            <span className="text-slate-500 font-mono">• Architectural Talent Intelligence</span>
          </div>
          <p className="text-slate-500 font-mono text-[11px]">Academic & Enterprise Research Benchmark • Secondary Color: #3F471E</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;