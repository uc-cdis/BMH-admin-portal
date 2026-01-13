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
 * Get user info from server-side cookies
 */
export async function getServerUser(): Promise<{
  name: string;
  email?: string;
} | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('id_token')?.value;

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
 * Check if user is authenticated on server
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const token = await getServerAccessToken();
  return !!token;
}
