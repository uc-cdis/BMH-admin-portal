'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/oidc';
import { authorizeAdmin } from '@/lib/auth/authorization';

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // Check authentication
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Check authorization
      try {
        const isAdmin = await authorizeAdmin(
          { resource: '/admin', service: 'workspace_admin' },
          process.env.NEXT_PUBLIC_ARBORIST_URI!,
          process.env.NEXT_PUBLIC_API_GW_ENDPOINT!,
          process.env.NEXT_PUBLIC_API_KEY!
        );

        if (!isAdmin) {
          router.push('/?error=unauthorized');
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Authorization check failed:', error);
        router.push('/?error=auth_check_failed');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">Admin workspace management</p>
    </div>
  );
}
