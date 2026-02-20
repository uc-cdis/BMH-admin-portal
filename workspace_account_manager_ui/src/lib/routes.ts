// lib/routes.ts
// Centralized route configuration for the BMH Admin Portal

/**
 * All valid routes in the application.
 * Used by not-found.tsx to distinguish between valid SPA routes
 * and actual 404 errors when served via CloudFront error pages.
 */
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LOGIN_CALLBACK: '/login/callback',
  WORKSPACE_ACCOUNTS: '/workspace-accounts',
  ADMIN: '/admin',
  REQUEST_WORKSPACE: '/request-workspace',
} as const;

/**
 * Array of all valid route paths.
 * Add new routes here when you create new pages.
 */
export const VALID_ROUTES = Object.values(APP_ROUTES);

/**
 * Check if a pathname is a valid route in the application.
 *
 * @param pathname - The pathname to check (e.g., '/login/callback')
 * @returns true if the pathname is a valid route
 */
export function isValidRoute(pathname: string): boolean {
  return VALID_ROUTES.some(route => {
    // Exact match
    if (pathname === route) return true;

    // Support for routes with trailing slashes
    if (pathname === route + '/') return true;

    // Add support for dynamic routes here if needed:
    // Example: /workspace/:id pattern
    // if (pathname.match(/^\/workspace\/[^/]+$/)) return true;

    return false;
  });
}
