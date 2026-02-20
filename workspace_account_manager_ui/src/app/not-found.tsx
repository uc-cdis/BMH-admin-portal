'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import Link from 'next/link';
import { LoadingScreen } from '@/components/loading-screen';
import { isValidRoute, APP_ROUTES } from '@/lib/routes';

export default function NotFound() {
  const pathname = usePathname();
  const [showRealError, setShowRealError] = useState(false);

  // Check if route is valid (memoized to prevent recalculation)
  const isValid = useMemo(() => isValidRoute(pathname), [pathname]);

  useEffect(() => {
    if (!isValid) {
      // For invalid routes, show error after brief delay to prevent flash
      const timer = setTimeout(() => {
        setShowRealError(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isValid]);

  // Valid route - show loader while Next.js takes over
  if (isValid) {
    return <LoadingScreen message="Loading page..." />;
  }

  // Invalid route but still in delay period - show loader
  if (!showRealError) {
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
              The page you&apos;re looking for doesn&apos;t exist or may have been moved.
            </Text>
          </Stack>
        </Alert>

        <Stack gap="sm" align="center">
          <Button
            component={Link}
            href={APP_ROUTES.HOME}
            size="lg"
            variant="filled"
          >
            Go to Homepage
          </Button>
        </Stack>
      </Stack>
    </div>
  );
}
