'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { authenticated, login } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (authenticated) {
      window.location.href = '/';
    }
  }, [authenticated]);

  const handleLogin = () => {
    login()
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {(process.env.NEXT_PUBLIC_DISPLAY_NAME) || 'Workspace Admin Portal'} Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">
              {error === 'invalid_state' && 'Invalid state parameter'}
              {error === 'authentication_failed' && 'Authentication failed'}
              {error === 'invalid_request' && 'Invalid request'}
              {error === 'unauthorized' && 'You do not have permission to access this resource'}
            </p>
          </div>
        )}

        <div>
          <button
            onClick={handleLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in with SSO
          </button>
        </div>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
