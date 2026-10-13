import React, { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GuidedTourModal } from './GuidedTourModal';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onPostJobClick?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, breadcrumbs }) => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTour, setShowTour] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  const isRecruiter = userRole === 'recruiter';

  interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: string;
  }

  const recruiterNav: NavItem[] = [
    {
      label: 'Recruiter Workspace',
      path: '/recruiter/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Job Requisitions',
      path: '/job-posting',
      badge: 'Active',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Platform Settings',
      path: '/settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const candidateNav: NavItem[] = [
    {
      label: 'Candidate Portal',
      path: '/jobseeker/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const activeNav = isRecruiter ? recruiterNav : candidateNav;

  return (
    <div className="min-h-screen bg-architectural-grid flex font-sans antialiased text-slate-800 relative">
      {/* CAD Subtle Radial Geometry Watermark Background */}
      <div className="absolute inset-0 bg-cad-arc pointer-events-none opacity-40"></div>

      {/* ENTERPRISE ARCHITECTURAL SIDEBAR */}
      <aside className="w-64 bg-white/95 border-r border-terracotta-200/90 flex flex-col justify-between p-4 hidden md:flex sticky top-0 h-screen z-30 backdrop-blur-md shadow-subtle">
        <div>
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center space-x-2.5 px-2 py-3 mb-6 group">
            <img 
              src="/hirica-logo-clean.png" 
              alt="HIRICA Logo" 
              className="h-7 w-auto object-contain group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/hirica-logo-transparent.png';
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900 tracking-tight">HIRICA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-olive-100 text-olive-800 border border-olive-300 font-semibold">
                  CAD-SYS
                </span>
              </div>
              <span className="block text-[10px] font-medium text-slate-500 tracking-wider">Talent Intelligence</span>
            </div>
          </Link>

          {/* Section: Active Mode Indicator */}
          <div className="px-2 mb-5">
            <div className="bg-olive-50/80 border border-olive-200 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRecruiter ? 'bg-olive-700 animate-pulse' : 'bg-primary-500'}`} />
                <span className="text-[11px] font-semibold text-slate-800">
                  {isRecruiter ? 'Recruiter Console' : 'Applicant Portal'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-olive-800 font-bold">v2.4</span>
            </div>
          </div>

          {/* Core Navigation */}
          <div className="space-y-6 px-1">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">Main Navigation</p>
              <nav className="space-y-1">
                {activeNav.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-olive-100 text-olive-900 border border-olive-300 shadow-subtle font-semibold'
                          : 'text-slate-600 hover:bg-olive-50/70 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className={isActive ? 'text-olive-800' : 'text-slate-400'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-olive-200 text-olive-800 border border-olive-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* AI Intelligence Module Indicators */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">AI Subsystems</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-700 bg-white border border-terracotta-200 shadow-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Multi-Agent Core
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">8 Online</span>
                </div>
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-700 bg-white border border-terracotta-200 shadow-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600"></span>
                    LLM Engine (Groq)
                  </span>
                  <span className="text-[10px] font-mono text-terracotta-700 font-semibold">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Session & Logout Footnote */}
        <div className="pt-4 border-t border-terracotta-200">
          <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-terracotta-50/60 border border-terracotta-200 mb-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded bg-terracotta-700 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate text-left">
                <p className="text-[11px] font-semibold text-slate-900 truncate">{currentUser?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[9px] text-slate-500 capitalize">{userRole || 'Candidate'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* TOP BAR / APPLICATION HEADER */}
        <header className="bg-white/90 border-b border-terracotta-200/90 px-6 py-3 sticky top-0 z-20 flex items-center justify-between backdrop-blur-md shadow-xs">
          {/* Breadcrumbs / Requisition Indicator */}
          <div className="flex items-center space-x-2 text-xs">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <span className="text-terracotta-300">/</span>}
                  {crumb.href ? (
                    <Link to={crumb.href} className="text-slate-500 hover:text-terracotta-700 font-medium">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-semibold">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <span className="text-slate-800 font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600"></span>
                {isRecruiter ? 'HIRICA Talent Acquisition Workspace' : 'HIRICA Candidate Opportunities'}
              </span>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Search */}
            <div className="hidden sm:flex items-center space-x-2 bg-terracotta-50/50 border border-terracotta-200 px-3 py-1.5 rounded-lg text-xs w-60 focus-within:border-terracotta-500 focus-within:bg-white transition-all">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search candidates, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Tour Guide Action */}
            <button
              onClick={() => setShowTour(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-olive-300 bg-olive-50 hover:bg-olive-100 text-olive-900 text-xs font-bold transition-all shadow-2xs"
              title="Open System Guided Tour"
            >
              <span>🧭</span>
              <span className="hidden md:inline">System Tour</span>
            </button>

            {/* Recruiter Primary Action */}
            {isRecruiter && (
              <Link
                to="/job-posting"
                className="btn-brand"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Requisition</span>
              </Link>
            )}
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="p-6 md:p-8 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Guided Tour Interactive Modal */}
      <GuidedTourModal isOpen={showTour} onClose={() => setShowTour(false)} />
    </div>
  );
};
