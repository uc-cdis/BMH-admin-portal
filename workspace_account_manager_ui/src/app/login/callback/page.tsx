'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
  validateState,
  validateNonce,
  exchangeCodeForTokens,
  storeTokens,
} from '@/lib/auth/oidc';
import { APP_ROUTES, validateRedirectPath } from '@/lib/utils/routes';

function LoginCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const oauthError = searchParams.get('error');

      // Handle OAuth errors
      if (oauthError) {
        console.error('❌ OAuth error:', oauthError);
        setError(oauthError);
        setProcessing(false);
        return;
      }

      // Check required parameters
      if (!code || !state) {
        console.error('❌ Missing code or state');
        setError('invalid_request');
        setProcessing(false);
        return;
      }

      // Validate state (CSRF protection)
      if (!validateState(state)) {
        console.error('❌ State validation failed');
        setError('invalid_state');
        setProcessing(false);
        return;
      }

      try {
        // Exchange code for tokens (direct API call)
        const tokens = await exchangeCodeForTokens(
          code,
          process.env.NEXT_PUBLIC_API_GW_ENDPOINT!,
          process.env.NEXT_PUBLIC_API_KEY!
        );

        // Validate nonce
        const decoded: any = jwtDecode(tokens.id_token);
        if (!validateNonce(decoded.nonce)) {
          console.error('❌ Nonce validation failed');
          setError('invalid_nonce');
          setProcessing(false);
          return;
        }

        // Store tokens in localStorage
        storeTokens(tokens);

        // Get redirect URL
        const storedPath = localStorage.getItem('redirect_after_login') || APP_ROUTES.HOME;
        localStorage.removeItem('redirect_after_login');

        const redirectUrl = validateRedirectPath(storedPath);

        // Redirect to app
        if (redirectUrl){
          window.location.href = redirectUrl;
        }

      } catch (err) {
        console.error('❌ Authentication error:', err);
        setError('authentication_failed');
        setProcessing(false);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Authentication Error</p>
            <p className="text-sm mt-2">
              {error === 'invalid_state' && 'Security validation failed. Please try again.'}
              {error === 'invalid_nonce' && 'Security validation failed. Please try again.'}
              {error === 'authentication_failed' && 'Authentication failed. Please try again.'}
              {error === 'invalid_request' && 'Invalid request. Missing required parameters.'}
            </p>
            <a
              href={APP_ROUTES.LOGIN}
              className="mt-4 inline-block text-sm underline hover:text-red-800"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait...</p>
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
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
      <LoginCallbackContent />
    </Suspense>
  );
}
