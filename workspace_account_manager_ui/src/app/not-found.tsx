'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import Link from 'next/link';
import { LoadingScreen } from '@/components/loading-screen';
import { isValidRoute, APP_ROUTES } from '@/lib/routes';


function NotFoundContent() {
     const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isValid = isValidRoute(pathname);

    useEffect(() => {
        // Build full URL with query parameters
        const queryString = searchParams.toString();
        const fullPath = queryString ? `${pathname}?${queryString}` : pathname;

        console.log('🔍 NotFound:', {
            pathname,
            queryString,
            fullPath,
            isValid
        });

        if (isValid) {
            console.log('✅ Valid route detected, redirecting with query params...');
            console.log('🔀 Redirecting to:', fullPath);

            // Redirect with full path including query parameters
            router.push(fullPath);
        }
    }, [pathname, searchParams, isValid, router]);

    // Show loader while redirecting
    if (isValid) {
        return <LoadingScreen message="Redirecting..." />;
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

                <div className="w-full max-w-md space-y-3">
                    <Button
                        component={Link}
                        href={APP_ROUTES.HOME}
                        size="lg"
                        variant="filled"
                        fullWidth
                        maw={400}
                    >
                        Go to Homepage
                    </Button>
                </div>
            </Stack>
        </div>
    );
}

export default function NotFound() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
            <NotFoundContent />
        </Suspense>
    );
}
