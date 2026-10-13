import { type FC, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const JobSeekerLogin: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      localStorage.setItem('hirica_user_role', 'jobseeker');
      if (setUserRole) setUserRole('jobseeker');
      await signInWithEmailAndPassword(auth, email, password);
      if (setUserRole) setUserRole('jobseeker');
      navigate('/jobseeker/dashboard');
    } catch (err: any) {
      console.error('Candidate sign-in error:', err);
      setError('Invalid credentials. Please verify your candidate email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-architectural-grid text-slate-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-olive-800 selection:text-white relative overflow-hidden">
      {/* CAD BLUEPRINT GEOMETRIC ACCENTS */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <svg className="absolute -top-32 -left-32 w-[700px] h-[700px] opacity-35 text-olive-800/40" viewBox="0 0 700 700" fill="none">
          <circle cx="200" cy="350" r="160" stroke="#3F471E" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
          <circle cx="200" cy="350" r="280" stroke="#3F471E" strokeWidth="0.8" opacity="0.4" />
          <line x1="0" y1="350" x2="700" y2="350" stroke="#3F471E" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3" />
          <text x="310" y="300" fill="#3F471E" fontSize="9" fontFamily="monospace" opacity="0.75">+ 112.5m CAND-AUTH</text>
        </svg>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex flex-col items-center mb-5 group">
          {/* CLEAN TRANSPARENT LOGO WITHOUT BLACK CONTAINER */}
          <img 
            src="/hirica-logo-clean.png" 
            alt="HIRICA Logo" 
            className="h-10 w-auto object-contain group-hover:scale-105 transition-transform mb-1.5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/hirica-logo-transparent.png';
            }}
          />
          <span className="text-[10px] font-mono tracking-widest text-olive-800 uppercase font-bold">
            Talent Acquisition Intelligence
          </span>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-olive-100 text-olive-900 border border-olive-300 text-[11px] font-mono mb-2 font-bold">
          Candidate Career Center
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Sign In to Candidate Portal
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Track application status, take proctored assessments, and participate in AI interviews.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="card-enterprise p-8 border-olive-300 shadow-md">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-xs text-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Candidate Email
              </label>
              <input
                type="email"
                required
                placeholder="candidate@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-olive-600 focus:ring-1 focus:ring-olive-600 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-olive-600 focus:ring-1 focus:ring-olive-600 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brand !py-2.5 text-xs font-bold shadow-md"
            >
              {loading ? 'Authenticating...' : 'Sign In as Candidate ➔'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-olive-100 flex items-center justify-between text-xs">
            <Link to="/recruiter/login" className="text-slate-600 hover:text-slate-900">
              Recruiter Workspace Sign In
            </Link>
            <Link to="/jobseeker/register" className="text-olive-800 hover:text-olive-900 font-bold">
              Create Candidate Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerLogin;