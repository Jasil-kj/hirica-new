import { type FC, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing: FC = () => {
  useEffect(() => {
    console.log('Landing: Component mounted');
    return () => console.log('Landing: Component unmounted');
  }, []);
  
  console.log('Landing: Rendering...');
  
  // Create a standalone page that doesn't depend on any external styles or components
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Hirica</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/recruiter/login"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Recruiter Login
              </Link>
              <Link
                to="/jobseeker/login"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Job Seeker Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Welcome to Hirica
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Your trusted platform for connecting talented professionals with great opportunities
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-16">
          {/* Recruiter Card */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">For Recruiters</h2>
                <p className="mt-4 text-gray-500">
                  Post jobs, manage candidates, and find the perfect match for your organization
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-3 text-gray-700">Post and manage job listings</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-3 text-gray-700">Monitor candidate test activity</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-3 text-gray-700">View detailed test results</span>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/recruiter/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Recruiter Login
                </Link>
              </div>
            </div>
          </div>

          {/* Job Seeker Card */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">For Job Seekers</h2>
                <p className="mt-4 text-gray-500">
                  Find your dream job, showcase your skills, and take assessments
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-3 text-gray-700">Browse job listings</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-3 text-gray-700">Upload resume for eligibility check</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-3 text-gray-700">Take job-specific assessments</span>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/jobseeker/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Job Seeker Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing; 