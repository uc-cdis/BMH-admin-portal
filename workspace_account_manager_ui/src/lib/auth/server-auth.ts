import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

interface DecodedIdToken {
  nonce: string;
  context: {
    user: {
      name: string;
      [key: string]: any;
    };
  };
  email?: string;
  [key: string]: any;
}

/**
 * Get access token from server-side cookies
 */
export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value ?? null;
}

/**
 * Get ID token from cookies (server-side)
 */
export async function getServerIdToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('id_token')?.value ?? null;
}

/**
 * Get refresh token from cookies (server-side)
 */
export async function getServerRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('refresh_token')?.value ?? null;
}

/**
 * Get all tokens from cookies (server-side)
 */
export async function getServerAllTokens(): Promise<{
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
}> {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get('access_token')?.value ?? null,
    idToken: cookieStore.get('id_token')?.value ?? null,
    refreshToken: cookieStore.get('refresh_token')?.value ?? null,
  };
}

/**
 * Get user info from server-side cookies
 */
export async function getServerUser(): Promise<{
  name: string;
  email?: string;
} | null> {
  const idToken = await getServerIdToken();

  if (!idToken) {
    return null;
  }

  try {
    const decoded = jwtDecode<DecodedIdToken>(idToken);
    return {
      name: decoded.context?.user?.name ?? 'Unknown',
      email: decoded.email,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get user name from token (server-side)
 */
export async function getServerUserName(): Promise<string | null> {
  const user = await getServerUser();
  return user?.name ?? null;
}

/**
 * Get user email from token (server-side)
 */
export async function getServerUserEmail(): Promise<string | null> {
  const user = await getServerUser();
  return user?.email ?? null;
}

/**
 * Check if user is authenticated on server
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const accessToken = await getServerAccessToken();
  return !!accessToken && accessToken !== 'undefined';
}

/**
 * Check if token is expired (server-side)
 */
export function isServerTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedIdToken>(token);
    if (!decoded.exp) return true;

    const expirationTime = decoded.exp * 1000;
    return Date.now() >= expirationTime;
  } catch (err) {
    console.error('Error checking token expiration:', err);
    return true;
  }
}

/**
 * Check if access token is expired (server-side)
 */
export async function isServerAccessTokenExpired(): Promise<boolean> {
  const token = await getServerAccessToken();
  if (!token) return true;
  return isServerTokenExpired(token);
}
