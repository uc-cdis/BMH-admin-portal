'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Alert, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import Link from 'next/link';
import { LoadingScreen } from '@/components/loading-screen';
import { isValidRoute, APP_ROUTES } from '@/lib/routes';

export default function NotFound() {
  const pathname = usePathname();
  const [checksPassed, setChecksPassed] = useState(0);

  // Simple check without useMemo
  const isValid = isValidRoute(pathname);

  useEffect(() => {
    console.log('🔄 NotFound: Mounted', { pathname, isValid });

    if (isValid) {
      console.log('✅ Valid route, giving Next.js router time to take over...');

      // Give Next.js router more time to take over (5 seconds total)
      const timers = [
        setTimeout(() => {
          console.log('⏱️  1 second elapsed...');
          setChecksPassed(1);
        }, 1000),
        setTimeout(() => {
          console.log('⏱️  2 seconds elapsed...');
          setChecksPassed(2);
        }, 2000),
        setTimeout(() => {
          console.log('⏱️  3 seconds elapsed...');
          setChecksPassed(3);
        }, 3000),
        setTimeout(() => {
          console.log('⏱️  5 seconds elapsed...');
          setChecksPassed(5);
        }, 5000),
      ];

      return () => {
        console.log('🧹 Cleanup timers');
        timers.forEach(clearTimeout);
      };
    } else {
      console.log('❌ Invalid route, will show 404');
      // Show 404 after brief delay
      const timer = setTimeout(() => setChecksPassed(999), 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, isValid]);

  console.log('🎨 Rendering NotFound', { pathname, isValid, checksPassed });

  // Valid route - keep showing loader
  if (isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
          <p className="text-sm text-gray-400 mt-2">
            {checksPassed === 0 && 'Initializing...'}
            {checksPassed === 1 && 'Loading components...'}
            {checksPassed === 2 && 'Still loading...'}
            {checksPassed === 3 && 'Almost there...'}
            {checksPassed >= 5 && (
              <span className="text-yellow-600">
                This is taking longer than expected. There might be an issue with the page.
                <br />
                <Link href="/" className="text-blue-600 underline">Click here to go home</Link>
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Invalid route but still in delay
  if (checksPassed < 999) {
    return <LoadingScreen message="Loading..." />;
  }

  // Real 404 error
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

          <Link href={APP_ROUTES.WORKSPACE_ACCOUNTS}>
            <button className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              View Workspaces
            </button>
          </Link>
        </div>
      </Stack>
    </div>
  );
}
