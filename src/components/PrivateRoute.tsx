import { type FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  userType?: 'recruiter' | 'jobseeker';
}

const PrivateRoute: FC<PrivateRouteProps> = ({ children, userType }) => {
  const { currentUser, userRole, loading, firebaseAvailable } = useAuth();
  const cachedRole = (localStorage.getItem('hirica_user_role') as 'recruiter' | 'jobseeker') || null;
  const effectiveRole = userRole || cachedRole;

  // Wait for loading to finish before making routing decisions
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    );
  }

  // If Firebase is not available, just render content
  if (!firebaseAvailable) {
    console.warn('PrivateRoute: Firebase not available, rendering children anyway');
    return <>{children}</>;
  }

  // If user is not authenticated, redirect to landing page
  if (!currentUser) {
    console.log('PrivateRoute: No user authenticated, redirecting to landing page');
    return <Navigate to="/" replace />;
  }

  // If userType is specified and effectiveRole is known, ensure proper routing
  if (userType && effectiveRole && effectiveRole !== userType) {
    console.warn(`PrivateRoute: User role '${effectiveRole}' does not match required '${userType}'`);
    const targetDashboard = effectiveRole === 'recruiter' ? '/recruiter/dashboard' : '/jobseeker/dashboard';
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 