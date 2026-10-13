import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="relative isolate">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Transform Your Hiring Process
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Generate role-specific assessments based on actual job advertisements.
            Find the perfect candidates with our AI-powered assessment platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-semibold leading-6 text-gray-900"
                >
                  Sign in <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
            <div className="sm:flex lg:block">
              <div className="sm:flex-shrink-0">
                <div className="flow-root">
                  <div className="rounded-xl bg-gray-50 p-8">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">
                      Role-Specific Tests
                    </h3>
                    <p className="mt-4 text-base leading-7 text-gray-600">
                      Generate assessments tailored to your job requirements, ensuring candidates are tested on relevant skills.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="sm:flex lg:block">
              <div className="sm:flex-shrink-0">
                <div className="flow-root">
                  <div className="rounded-xl bg-gray-50 p-8">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">
                      Anti-Cheating System
                    </h3>
                    <p className="mt-4 text-base leading-7 text-gray-600">
                      Our advanced anti-cheating system ensures test integrity with features like tab switching prevention and IP tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="sm:flex lg:block">
              <div className="sm:flex-shrink-0">
                <div className="flow-root">
                  <div className="rounded-xl bg-gray-50 p-8">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">
                      Automated Evaluation
                    </h3>
                    <p className="mt-4 text-base leading-7 text-gray-600">
                      Get instant results and performance metrics to make informed hiring decisions quickly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 