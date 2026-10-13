import { type FC, Suspense, Component, type ReactNode, type ErrorInfo, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import RecruiterLogin from './pages/RecruiterLogin';
import RecruiterRegister from './pages/RecruiterRegister';
import JobSeekerLogin from './pages/JobSeekerLogin';
import JobSeekerRegister from './pages/JobSeekerRegister';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import Dashboard from './pages/Dashboard';
import JobPosting from './pages/JobPosting';
import Assessment from './pages/Assessment';
import JobDetail from './pages/JobDetail';
import { JobApplication } from './components/JobApplication';
import AssessmentResults from './pages/AssessmentResults';
import AIInterview from './pages/AIInterview';

const DashboardRedirect: FC = () => {
  const { userRole } = useAuth();
  const cachedRole = (localStorage.getItem('hirica_user_role') as 'recruiter' | 'jobseeker') || null;
  const role = userRole || cachedRole;
  if (role === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" replace />;
  }
  return <Navigate to="/jobseeker/dashboard" replace />;
};

// Loading component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error boundary component
const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <p className="text-gray-600">Please try refreshing the page</p>
    </div>
  </div>
);

// Debugging component to display the app state
const AppDebug = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-2 text-xs border-t border-gray-300 z-50">
      <div className="max-w-7xl mx-auto">
        <p>App is running - Debug info</p>
      </div>
    </div>
  );
};

const App: FC = () => {
  const [appReady, setAppReady] = useState(false);
  
  // Force the app to show after a short delay
  useEffect(() => {
    console.log('App: Mounting component...');
    
    // Set app as ready after a short delay
    const timer = setTimeout(() => {
      console.log('App: Setting app as ready');
      setAppReady(true);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      console.log('App: Unmounting component');
    };
  }, []);
  
  console.log('App: Rendering...', { appReady });
  
  // Show very basic content if we're having trouble loading the app
  if (!appReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Hirica</h1>
        <p className="mt-4">Loading application...</p>
        <div className="mt-8 animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <Router>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <AuthProvider>
          <AppDebug />
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/recruiter/login" element={<RecruiterLogin />} />
              <Route path="/recruiter/register" element={<RecruiterRegister />} />
              <Route path="/jobseeker/login" element={<JobSeekerLogin />} />
              <Route path="/jobseeker/register" element={<JobSeekerRegister />} />

              {/* Additional route for /job-posting */}
              <Route path="/job-posting" element={<JobPosting />} />
              
              {/* Add route for viewing job details */}
              <Route path="/job/:jobId" element={<JobDetail />} />

              {/* Protected Routes */}
              <Route
                path="/recruiter/dashboard"
                element={
                  <PrivateRoute userType="recruiter">
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/recruiter/post-job"
                element={
                  <PrivateRoute userType="recruiter">
                    <JobPosting />
                  </PrivateRoute>
                }
              />
              <Route
                path="/jobseeker/dashboard"
                element={
                  <PrivateRoute userType="jobseeker">
                    <JobSeekerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/assessment/:assessmentId"
                element={
                  <PrivateRoute>
                    <Assessment />
                  </PrivateRoute>
                }
              />
              <Route
                path="/results/:assessmentId"
                element={
                  <PrivateRoute>
                    <AssessmentResults />
                  </PrivateRoute>
                }
              />
              <Route
                path="/assessment-complete"
                element={
                  <PrivateRoute>
                    <AssessmentResults />
                  </PrivateRoute>
                }
              />
              <Route
                path="/interview/:applicationId"
                element={
                  <PrivateRoute>
                    <AIInterview />
                  </PrivateRoute>
                }
              />
              <Route path="/jobs/:jobId/apply" element={<JobApplication />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardRedirect />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
};

// Error Boundary component
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default App; 