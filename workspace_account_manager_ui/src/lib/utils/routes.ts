// Centralized route configuration for the BMH Admin Portal

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

    return false;
  });
}

export function validateRedirectPath(
  path: string | null | undefined
): string | null {
  // No path provided - use default
  if (!path || typeof path !== 'string') {
    console.log('ℹ️ No redirect path provided');
    return null;
  }

  try {
    if (isValidRoute(path)) {
      return path;
    }
    // Check 1: Must start with / (relative path)
    if (!path.startsWith('/')) {
      console.warn('⚠️ Redirect path must start with /:', path);
      return null;
    }

    // Check 2: Must not be protocol-relative URL (//)
    if (path.startsWith('//')) {
      console.warn('⚠️ Protocol-relative URLs blocked:', path);
      return null;
    }

    // Check 3: Parse as URL to validate format
    const url = new URL(path, window.location.origin);

    // Check 4: Must be same origin
    if (url.origin !== window.location.origin) {
      console.warn('⚠️ Cross-origin redirect blocked:', {
        attempted: url.origin,
        current: window.location.origin,
      });
      return null;
    }

    // All checks passed - return sanitized path
    const sanitizedPath = url.pathname + url.search + url.hash;
    return sanitizedPath;
  } catch (err) {
    console.warn('⚠️ Invalid redirect path:', path, err);
    return null;
  }
}
