// lib/utils/secure-redirect.ts

export function validateRedirectPath(
  path: string | null | undefined,
  defaultPath: string = '/'
): string {
  // No path provided - use default
  if (!path || typeof path !== 'string') {
    console.log('ℹ️ No redirect path provided, using default:', defaultPath);
    return defaultPath;
  }

  try {
    // Check 1: Must start with / (relative path)
    if (!path.startsWith('/')) {
      console.warn('⚠️ Redirect path must start with /:', path);
      return defaultPath;
    }

    // Check 2: Must not be protocol-relative URL (//)
    if (path.startsWith('//')) {
      console.warn('⚠️ Protocol-relative URLs blocked:', path);
      return defaultPath;
    }

    // Check 3: Parse as URL to validate format
    const url = new URL(path, window.location.origin);

    // Check 4: Must be same origin
    if (url.origin !== window.location.origin) {
      console.warn('⚠️ Cross-origin redirect blocked:', {
        attempted: url.origin,
        current: window.location.origin,
      });
      return defaultPath;
    }

    // All checks passed - return sanitized path
    const sanitizedPath = url.pathname + url.search + url.hash;
    return sanitizedPath;
  } catch (err) {
    console.warn('⚠️ Invalid redirect path:', path, err);
    return defaultPath;
  }
}
