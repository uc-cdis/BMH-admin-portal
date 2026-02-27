// Centralized route configuration for the BMH Admin Portal

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LOGIN_CALLBACK: '/login/callback',
  WORKSPACE_ACCOUNTS: '/workspace-accounts',
  ADMIN: '/admin',
  REQUEST_WORKSPACE: '/request-workspace',
} as const;

export const VALID_ROUTES: string[] = Object.values(APP_ROUTES);

export function validateRedirectPath(
  path: string | null | undefined
): string | null {
  if (!path || typeof path !== 'string') {
    console.log('ℹ️ No redirect path provided');
    return null;
  }

  try {
    if (!path.startsWith('/')) {
      console.warn('⚠️ Redirect path must start with /:', path);
      return null;
    }

    if (path.startsWith('//')) {
      console.warn('⚠️ Protocol-relative URLs blocked:', path);
      return null;
    }

    const url = new URL(path, window.location.origin);

    if (!VALID_ROUTES.includes(url.pathname)) return null;

    // All checks passed - return sanitized path
    const sanitizedPath = url.pathname + url.search + url.hash;
    return sanitizedPath;
  } catch (err) {
    console.warn('⚠️ Invalid redirect path:', path, err);
    return null;
  }
}
