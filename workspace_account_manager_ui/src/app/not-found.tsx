'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Alert, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import Link from 'next/link';
import { LoadingScreen } from '@/components/loading-screen';
import { isValidRoute, APP_ROUTES } from '@/lib/routes';

export default function NotFound() {
  const pathname = usePathname();
  const [showRealError, setShowRealError] = useState(false);

  // Check if route is valid (memoized to prevent recalculation)
  const isValid = useMemo(() => {
    const result = isValidRoute(pathname);
    console.log('🔍 NotFound: Route validation', { pathname, isValid: result });
    return result;
  }, [pathname]);

  useEffect(() => {
    console.log('🔄 NotFound: useEffect triggered', { isValid, pathname });

    if (!isValid) {
      console.log('⏰ NotFound: Setting timer for real error display');
      // For invalid routes, show error after brief delay to prevent flash
      const timer = setTimeout(() => {
        console.log('✋ NotFound: Showing real error page');
        setShowRealError(true);
      }, 300);

      return () => {
        console.log('🧹 NotFound: Cleaning up timer');
        clearTimeout(timer);
      };
    } else {
      console.log('✅ NotFound: Valid route - waiting for Next.js router');
    }
  }, [isValid, pathname]);

  console.log('🎨 NotFound: Rendering', { isValid, showRealError, pathname });

  // Valid route - show loader while Next.js takes over
  if (isValid) {
    console.log('🔄 Rendering: LoadingScreen (valid route)');
    return <LoadingScreen message="Loading page..." />;
  }

  // Invalid route but still in delay period - show loader
  if (!showRealError) {
    console.log('🔄 Rendering: LoadingScreen (delay period)');
    return <LoadingScreen message="Loading..." />;
  }

  // Real 404 error
  console.log('❌ Rendering: 404 error page');
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Stack align="center" gap="lg" maw={500}>
        <Alert
          icon={<IconAlertTriangle size="2rem" />}
          title="Page Not Found"
          color="red"
          variant="light"
          w="100%"
        >
          <Stack gap="md">
            <Text>
              The page <strong>{pathname}</strong> could not be found.
            </Text>
            <Text size="sm" c="dimmed">
              The page you're looking for doesn't exist or may have been moved.
            </Text>
          </Stack>
        </Alert>

        <div className="w-full max-w-md space-y-3">
          <Link href={APP_ROUTES.HOME}>
            <button className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Go to Homepage
            </button>
          </Link>
        </div>
      </Stack>
    </div>
  );
}
