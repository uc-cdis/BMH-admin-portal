'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button, Stack } from '@mantine/core';
import { APP_ROUTES } from '@/lib/utils/routes';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { authenticated, login, loading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!loading && authenticated) {
      window.location.href = APP_ROUTES.HOME;
    }
  }, [authenticated, loading]);

  const handleLogin = () => {
    login()
  };

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-xl w-full space-y-8 py-8">
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

        <Stack align="center" gap="md">
          <Button
            onClick={handleLogin}
            size="lg"
            variant="filled"
            fullWidth
            maw={400}
          >
            Sign in with SSO
          </Button>
        </Stack>
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
