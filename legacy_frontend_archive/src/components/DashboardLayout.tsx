import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onPostJobClick?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  const isRecruiter = userRole === 'recruiter';

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex font-sans antialiased text-gray-800">
      {/* LEFT SIDEBAR - DONEZO STYLE */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between p-5 hidden md:flex sticky top-0 h-screen z-20">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md font-extrabold text-xl">
              H
            </div>
            <div>
              <span className="text-xl font-black text-gray-900 tracking-tight">HireKel</span>
              <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest">AI Hiring Suite</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">MENU</p>
              <nav className="space-y-1">
                <Link
                  to={isRecruiter ? '/recruiter/dashboard' : '/jobseeker/dashboard'}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    location.pathname.includes('dashboard')
                      ? 'bg-[#0F4C3A] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Dashboard</span>
                  </div>
                </Link>

                <Link
                  to={isRecruiter ? '/job-posting' : '/jobseeker/dashboard'}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    location.pathname.includes('job-posting') || location.pathname.includes('job')
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{isRecruiter ? 'Jobs & Openings' : 'Explore Jobs'}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">Live</span>
                </Link>

                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule & Calendar</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>AI Analytics</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Candidates</span>
                  </div>
                </div>
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">GENERAL</p>
              <nav className="space-y-1">
                <div className="flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Promo Mobile App Card */}
        <div className="bg-gradient-to-br from-[#0F4C3A] to-[#04281E] p-4 rounded-2xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl"></div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center mb-3">
            <span className="text-base">🚀</span>
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">HireKel AI Pro</h4>
          <p className="text-[11px] text-gray-200 mt-1 mb-3">Automated candidate matching & anti-cheat assessments.</p>
          <button className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold shadow transition-colors">
            Explore AI Suite
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR HEADER */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10 flex items-center justify-between shadow-xs">
          {/* Search Box */}
          <div className="flex items-center space-x-3 w-72 md:w-96 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search jobs, candidates, skills..."
              className="bg-transparent border-none outline-none text-xs w-full text-gray-800 placeholder-gray-400 font-medium"
            />
            <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-xs">⌘F</span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 relative transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white"></span>
            </button>

            {/* Profile Info */}
            <div className="flex items-center space-x-3 pl-2 border-l border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold flex items-center justify-center shadow-sm text-sm uppercase">
                {currentUser?.email ? currentUser.email.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {currentUser?.displayName || (isRecruiter ? 'Recruiter HR' : 'Job Seeker Candidate')}
                </p>
                <p className="text-[10px] text-gray-500 truncate max-w-[140px]">{currentUser?.email}</p>
              </div>
            </div>

            {/* Primary Action Button */}
            {isRecruiter && (
              <Link
                to="/job-posting"
                className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0F4C3A] hover:bg-[#083327] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>+ Post Job</span>
              </Link>
            )}
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="p-6 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
