'use client';

import { jwtDecode } from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';

interface DecodedToken {
  context?: {
    user?: {
      name?: string;
      [key: string]: any;
    };
  };
  email?: string;
  nonce?: string;
  exp?: number;
  [key: string]: any;
}

interface TokenSet {
  id_token: string;
  access_token: string;
  refresh_token: string;
}

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

/**
 * Safe localStorage setter
 */
function setItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to set ${key} in localStorage:`, error);
  }
}

/**
 * Safe localStorage getter
 */
function getItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(key);
    return value === 'undefined' ? null : value;
  } catch (error) {
    console.error(`Failed to get ${key} from localStorage:`, error);
    return null;
  }
}

/**
 * Safe localStorage remover
 */
function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error);
  }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  return getItem('access_token');
}

/**
 * Get ID token
 */
export function getIdToken(): string | null {
  return getItem('id_token');
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  return getItem('refresh_token');
}

/**
 * Store tokens
 */
export function storeTokens(tokens: TokenSet): void {
  setItem('id_token', tokens.id_token);
  setItem('access_token', tokens.access_token);
  setItem('refresh_token', tokens.refresh_token);
  console.log('✅ Tokens stored in localStorage');
}

/**
 * Remove all tokens
 */
export function removeTokens(): void {
  removeItem('id_token');
  removeItem('access_token');
  removeItem('refresh_token');
  removeItem('oauth_state');
  removeItem('oauth_nonce');
  removeItem('redirect_after_login');
  console.log('🗑️ All tokens removed from localStorage');
}

// ============================================================================
// AUTHENTICATION STATUS
// ============================================================================

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  // Check if token is expired
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp) {
      const now = Date.now() / 1000;
      return decoded.exp > now;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user name from token
 */
export function getName(): string | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.context?.user?.name ?? 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Get user email from token
 */
export function getEmail(): string | null {
  const idToken = getIdToken();
  if (!idToken) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(idToken);
    return decoded.email ?? null;
  } catch {
    return null;
  }
}

// ============================================================================
// OAUTH FLOW
// ============================================================================

/**
 * Initiate OAuth login
 */
export function initiateLogin(
  authUri: string,
  clientId: string,
  redirectUri: string,
  authService: string,
  redirectAfterLogin: string = '/'
): void {
  if (typeof window === 'undefined') return;

  const state = uuidv4();
  const nonce = uuidv4();

  console.log('🚀 Initiating OAuth login');

  // Store in localStorage
  setItem('oauth_state', state);
  setItem('oauth_nonce', nonce);
  setItem('redirect_after_login', redirectAfterLogin);

  // Build OAuth URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    nonce: nonce,
    scope: 'openid user',
    idp: authService,
  });

  const authUrl = `${authUri}?${params.toString()}`;
  console.log('🔗 Redirecting to OAuth provider');

  window.location.assign(authUrl);
}

/**
 * Validate state (CSRF protection)
 */
export function validateState(receivedState: string): boolean {
  const storedState = getItem('oauth_state');
  const isValid = receivedState === storedState;

  console.log('🔍 State validation:', {
    received: receivedState?.substring(0, 10),
    stored: storedState?.substring(0, 10),
    valid: isValid,
  });

  if (isValid) {
    removeItem('oauth_state');
  }

  return isValid;
}

/**
 * Validate nonce (replay protection)
 */
export function validateNonce(receivedNonce: string): boolean {
  const storedNonce = getItem('oauth_nonce');
  const isValid = receivedNonce === storedNonce;

  console.log('🔍 Nonce validation:', {
    received: receivedNonce?.substring(0, 10),
    stored: storedNonce?.substring(0, 10),
    valid: isValid,
  });

  if (isValid) {
    removeItem('oauth_nonce');
  }

  return isValid;
}

/**
 * Exchange authorization code for tokens
 * Calls backend API directly from browser
 */
export async function exchangeCodeForTokens(
  code: string,
  apiEndpoint: string,
  apiKey: string
): Promise<TokenSet> {
  console.log('💱 Exchanging code for tokens...');

  const response = await fetch(
    `${apiEndpoint}/auth/get-tokens?code=${code}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Failed to exchange code: ${response.status}`);
  }

  const data = await response.json();

  if (!data.id_token || !data.access_token || !data.refresh_token) {
    throw new Error('Invalid token response');
  }

  return {
    id_token: data.id_token,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}

/**
 * Refresh tokens
 */
export async function refreshTokens(): Promise<boolean> {
  const apiEndpoint = process.env.NEXT_PUBLIC_API_GW_ENDPOINT!;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY!;
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.error('❌ No refresh token');
    return false;
  }

  try {
    console.log('🔄 Refreshing tokens...');

    const response = await fetch(
      `${apiEndpoint}/auth/refresh-tokens`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens = await response.json();
    storeTokens(tokens);

    console.log('✅ Tokens refreshed');
    return true;

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return false;
  }
}

/**
 * Logout
 */
export function logout(): void {
  console.log('👋 Logging out...');
  removeTokens();

  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
