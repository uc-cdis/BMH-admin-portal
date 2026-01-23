'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/oidc';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true
}: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !isAuthenticated()) {
      // Store current path to redirect back after login
      localStorage.setItem('redirect_after_login', window.location.pathname);
      router.push('/login');
    }
  }, [requireAuth, router]);

  // Don't render protected content until auth check is done
  if (typeof window !== 'undefined' && requireAuth && !isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
