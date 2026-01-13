import { jwtDecode } from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';

interface DecodedIdToken {
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
 * Check if user is authenticated by verifying access token exists
 */
export function isAuthenticated(): boolean {
  const accessToken = getAccessToken();
  return !!accessToken;
}

/**
 * Extract user name from access token
 */
export function getName(): string | null {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const decoded = jwtDecode<DecodedIdToken>(accessToken);
    return decoded.context?.user?.name ?? 'Unknown';
  } catch (err) {
    console.error('Could not retrieve name from id token:', err);
    return 'Unknown';
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  return getToken('access_token');
}

/**
 * Get ID token from localStorage
 */
export function getIdToken(): string | null {
  return getToken('id_token');
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return getToken('refresh_token');
}

/**
 * Generic token retrieval from localStorage
 */
function getToken(tokenType: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem(tokenType);

  // Clean up if undefined value is stored
  if (token === 'undefined' || token === null) {
    removeTokens();
    return null;
  }

  return token;
}

/**
 * Remove all auth tokens from localStorage
 */
export function removeTokens(): void {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem('id_token');
  window.localStorage.removeItem('refresh_token');
  window.localStorage.removeItem('access_token');
  window.localStorage.removeItem('state');
  window.localStorage.removeItem('nonce');
}

/**
 * Generate and store state/nonce, then redirect to OIDC provider
 */
export function initiateLogin(
  authUri: string,
  clientId: string,
  redirectUri: string,
  authService: string
): void {
  removeTokens();

  const state = uuidv4();
  const nonce = uuidv4();

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('state', state);
    window.localStorage.setItem('nonce', nonce);
  }

  const redirectLocation = [
    authUri,
    `?state=${state}&nonce=${nonce}`,
    '&response_type=code',
    `&client_id=${clientId}`,
    `&redirect_uri=${redirectUri}`,
    `&idp=${authService}`,
    '&scope=openid%20user',
  ].join('');

  console.log('Redirecting to', redirectLocation);

  if (typeof window !== 'undefined') {
    window.location.assign(redirectLocation);
  }
}

/**
 * Validate state parameter matches stored state
 */
export function validateState(checkState: string): boolean {
  if (typeof window === 'undefined') return false;

  const state = window.localStorage.getItem('state');
  window.localStorage.removeItem('state');
  return checkState === state;
}

/**
 * Validate nonce parameter matches stored nonce
 */
export function validateNonce(checkNonce: string): boolean {
  if (typeof window === 'undefined') return false;

  const nonce = window.localStorage.getItem('nonce');
  window.localStorage.removeItem('nonce');
  return checkNonce === nonce;
}

/**
 * Store tokens in localStorage after validation
 */
export function storeTokens(tokens: {
  id_token: string;
  access_token: string;
  refresh_token: string;
}): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem('id_token', tokens.id_token);
  window.localStorage.setItem('refresh_token', tokens.refresh_token);
  window.localStorage.setItem('access_token', tokens.access_token);
}

/**
 * Logout user and reload page
 */
export function logout(): void {
  removeTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
