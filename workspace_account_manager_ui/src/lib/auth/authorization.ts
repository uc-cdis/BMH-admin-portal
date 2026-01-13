import { getAccessToken as getAccessTokenClient, getRefreshToken, logout as logoutUser } from './oidc';
import { refreshTokens } from './auth-api';

interface ResourceConfig {
  resource: string;
  service: string;
}

interface UserAuthMapping {
  [resource: string]: Array<{
    method: string;
    service: string;
  }>;
}

/**
 * Check if user is authorized for at least one resource (login check)
 */
export async function authorizeLogin(
  resources: { CREDITS: ResourceConfig; GRANTS: ResourceConfig; ADMIN: ResourceConfig },
  arboristUri: string,
  apiEndpoint: string,
  apiKey: string
): Promise<boolean> {
  const userAuthMapping = await getUserAuthMapping(arboristUri, apiEndpoint, apiKey);

  const creditsAuth = await authorize(resources.CREDITS, userAuthMapping);
  const grantsAuth = await authorize(resources.GRANTS, userAuthMapping);
  const adminAuth = await authorize(resources.ADMIN, userAuthMapping);

  return creditsAuth || grantsAuth || adminAuth;
}

/**
 * Check if user has admin authorization
 */
export async function authorizeAdmin(
  adminResource: ResourceConfig,
  arboristUri: string,
  apiEndpoint: string,
  apiKey: string
): Promise<boolean> {
  const userAuthMapping = await getUserAuthMapping(arboristUri, apiEndpoint, apiKey);
  return authorize(adminResource, userAuthMapping);
}

/**
 * Check if user has credits authorization
 */
export async function authorizeCredits(
  creditsResource: ResourceConfig,
  arboristUri: string,
  apiEndpoint: string,
  apiKey: string
): Promise<boolean> {
  const userAuthMapping = await getUserAuthMapping(arboristUri, apiEndpoint, apiKey);
  return authorize(creditsResource, userAuthMapping);
}

/**
 * Check if user has grants authorization
 */
export async function authorizeGrants(
  grantsResource: ResourceConfig,
  arboristUri: string,
  apiEndpoint: string,
  apiKey: string
): Promise<boolean> {
  const userAuthMapping = await getUserAuthMapping(arboristUri, apiEndpoint, apiKey);
  return authorize(grantsResource, userAuthMapping);
}

/**
 * Check if user is authorized for a specific resource
 */
async function authorize(
  resourceMap: ResourceConfig,
  userAuthMapping: UserAuthMapping | null
): Promise<boolean> {
  const { resource, service: serviceName } = resourceMap;

  if (!userAuthMapping) {
    console.error('User auth mapping was not defined');
    return false;
  }

  if (resource in userAuthMapping) {
    const authorized = userAuthMapping[resource].some(
      (service) => service.method === 'access' && service.service === serviceName
    );
    return authorized;
  }

  console.warn(`Resource ${resource} did not exist in user auth mapping from Arborist`);
  return false;
}

/**
 * Get user authorization mapping from Arborist
 */
async function getUserAuthMapping(
  arboristUri: string,
  apiEndpoint: string,
  apiKey: string
): Promise<UserAuthMapping | null> {
  let accessToken = getAccessTokenClient();

  if (!accessToken) {
    console.error('Did not find access token, logging out');
    logoutUser();
    return null;
  }

  // Try to get auth mapping
  let userAuthMapping = await fetchUserAuthMapping(arboristUri, accessToken);

  // If failed, try refreshing token
  if (!userAuthMapping) {
    console.log('Did not receive user auth mapping, attempting token refresh');

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token available');
      logoutUser();
      return null;
    }

    try {
      const tokens = await refreshTokens(refreshToken, apiEndpoint, apiKey);

      // Store new tokens (client-side only)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('id_token', tokens.id_token);
        window.localStorage.setItem('refresh_token', tokens.refresh_token);
        window.localStorage.setItem('access_token', tokens.access_token);
      }

      accessToken = tokens.access_token;
      userAuthMapping = await fetchUserAuthMapping(arboristUri, accessToken);
    } catch (err) {
      console.error('Error refreshing tokens:', err);
      logoutUser();
      return null;
    }
  }

  // If still failed, log out
  if (!userAuthMapping) {
    console.error('Could not retrieve user auth mapping after refresh');
    logoutUser();
    return null;
  }

  return userAuthMapping;
}

/**
 * Fetch user authorization mapping from Arborist API
 */
async function fetchUserAuthMapping(
  arboristUri: string,
  accessToken: string
): Promise<UserAuthMapping | null> {
  try {
    const response = await fetch(arboristUri, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Arborist API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as UserAuthMapping;
  } catch (err) {
    console.error('Error getting user mapping from Arborist:', err);
    return null;
  }
}
