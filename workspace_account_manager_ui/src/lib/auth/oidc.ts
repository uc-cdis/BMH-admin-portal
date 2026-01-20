'use client'

import { jwtDecode } from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';

interface DecodedToken {
  nonce: string;
  context: {
    user: {
      name: string;
      [key: string]: any;
    };
  };
  [key: string]: any;
}

/**
 * Set a cookie (client-side)
 */
function setCookie(name: string, value: string, minutes: number): void {
  if (typeof document === 'undefined') {
    console.warn('Cannot set cookie on server side');
    return;
  }

  const maxAge = minutes * 60;
  const cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = cookie;
}

/**
 * Get a cookie value (client-side)
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }

  return null;
}

/**
 * Delete a cookie (client-side)
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

/**
 * Get all cookies as an object (client-side)
 */
function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  return document.cookie.split('; ').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=');
    if (name && value) {
      acc[name] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
}

// ============================================================================
// TOKEN GETTERS (CLIENT-SIDE)
// ============================================================================

/**
 * Get access token from cookies (client-side)
 */
export function getAccessToken(): string | null {
  return getCookie('access_token');
}

/**
 * Get ID token from cookies (client-side)
 */
export function getIdToken(): string | null {
  return getCookie('id_token');
}

/**
 * Get refresh token from cookies (client-side)
 */
export function getRefreshToken(): string | null {
  return getCookie('refresh_token');
}

/**
 * Get all auth tokens from cookies (client-side)
 */
export function getAllTokens(): {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
} {
  return {
    accessToken: getAccessToken(),
    idToken: getIdToken(),
    refreshToken: getRefreshToken(),
  };
}

// ============================================================================
// AUTHENTICATION STATUS
// ============================================================================

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
  const accessToken = getAccessToken();
  return !!accessToken && accessToken !== 'undefined';
}

/**
 * Get user name from token (client-side)
 */
export function getName(): string | null {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(accessToken);
    return decoded.context?.user?.name ?? 'Unknown';
  } catch (err) {
    console.error('Error decoding token:', err);
    return 'Unknown';
  }
}

/**
 * Get user email from token (client-side)
 */
export function getEmail(): string | null {
  const idToken = getIdToken();
  if (!idToken) {
    return null;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(idToken);
    return decoded.email ?? null;
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
}

/**
 * Check if token is expired (client-side)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (!decoded.exp) return true;

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (err) {
    console.error('Error checking token expiration:', err);
    return true;
  }
}

/**
 * Check if access token is expired (client-side)
 */
export function isAccessTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;
  return isTokenExpired(token);
}

/**
 * Generate and store state/nonce, then redirect to OIDC provider
 */
export function initiateLogin(
  authUri: string,
  clientId: string,
  redirectUri: string,
  authService: string,
  redirectAfterLogin: string = '/'
): void {
  if (typeof window === 'undefined') {
    console.error('❌ Cannot initiate login on server');
    return;
  }

  const state = uuidv4();
  const nonce = uuidv4();

  // Store OAuth state/nonce in cookies (10 minutes expiry)
  setCookie('oauth_state', state, 10);
  setCookie('oauth_nonce', nonce, 10);
  setCookie('redirect_after_login', redirectAfterLogin, 10);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    nonce: nonce,
    scope: 'openid user',
    idp: authService,
  });

  const redirectLocation = `${authUri}?${params.toString()}`;
  console.log('Redirecting to', redirectLocation);

  if (typeof window !== 'undefined') {
    window.location.assign(redirectLocation);
  }
}
/**
 * Logout user (client-side)
 */
export function logout(): void {
  if (typeof window === 'undefined') {
    console.warn('⚠️ Cannot logout on server side');
    return;
  }

  console.log('👋 Logging out...');

  // Delete auth cookies
  deleteCookie('id_token');
  deleteCookie('access_token');
  deleteCookie('refresh_token');

  // Delete OAuth cookies (in case they're still there)
  deleteCookie('oauth_state');
  deleteCookie('oauth_nonce');
  deleteCookie('redirect_after_login');

  // Redirect to login
  window.location.href = '/login';
}

/**
 * Refresh tokens (client-side)
 * Calls the server API to refresh tokens
 */
export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.error('❌ No refresh token available');
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    console.log('✅ Tokens refreshed successfully');
    return true;
  } catch (err) {
    console.error('❌ Error refreshing tokens:', err);
    logout();
    return false;
  }
}
