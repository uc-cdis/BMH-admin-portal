'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/oidc';
import { authorizeAdmin } from '@/lib/auth/authorization';
import { Center, Loader, Stack, Text, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute component for Next.js App Router
 *
 * Handles both basic authentication and admin authorization checks.
 *
 * @param requireAuth - Requires user to be logged in (default: true)
 * @param requireAdmin - Requires user to have admin privileges (default: false)
 *
 * @example
 * // Basic auth protection
 * <ProtectedRoute>
 *   <WorkspaceAccountsPage />
 * </ProtectedRoute>
 *
 * @example
 * // Admin auth protection
 * <ProtectedRoute requireAdmin>
 *   <AdminPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // Check basic authentication first
      if (requireAuth && !isAuthenticated()) {
        localStorage.setItem('redirect_after_login', window.location.pathname);
        router.push('/login');
        return;
      }

      // Check admin authorization if required
      if (requireAdmin) {
        try {
          const isAdmin = await authorizeAdmin();

          if (!isAdmin) {
            setIsAuthorized(false);
            setIsChecking(false);
            return;
          }

          setIsAuthorized(true);
        } catch (error) {
          console.error('Authorization check failed:', error);
          setIsAuthorized(false);
        }
      } else {
        // No admin check needed, just basic auth
        setIsAuthorized(true);
      }

      setIsChecking(false);
    }

    checkAuth();
  }, [requireAuth, requireAdmin, router]);

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Checking authorization...</Text>
        </Stack>
      </Center>
    );
  }

  // Show unauthorized message for admin routes
  if (requireAdmin && !isAuthorized) {
    return (
      <Center style={{ minHeight: '100vh' }} p="xl">
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Access Denied"
          color="red"
          variant="light"
          maw={500}
        >
          <Text>
            You do not have permission to access this page. Admin privileges are
            required.
          </Text>
        </Alert>
      </Center>
    );
  }

  return <>{children}</>;
}
