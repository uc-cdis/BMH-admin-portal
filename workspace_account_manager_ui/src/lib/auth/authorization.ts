'use client';

import { getAccessToken, getRefreshToken, refreshTokens, logout } from './oidc';

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
 * Check admin authorization (client-side)
 */
export async function authorizeAdmin(
  adminResource: ResourceConfig,
  arboristUri: string,
  apiEndpoint: string,
  apiKey: string
): Promise<boolean> {
  const userAuthMapping = await getUserAuthMapping(
    arboristUri,
    apiEndpoint,
    apiKey
  );
  return authorize(adminResource, userAuthMapping);
}

/**
 * Check authorization for a resource
 */
function authorize(
  resourceMap: ResourceConfig,
  userAuthMapping: UserAuthMapping | null
): boolean {
  if (!userAuthMapping) return false;

  const { resource, service: serviceName } = resourceMap;

  if (resource in userAuthMapping) {
    return userAuthMapping[resource].some(
      (service) => service.method === 'access' && service.service === serviceName
    );
  }

  return false;
}

/**
 * Get user authorization mapping (client-side API call)
 */
async function getUserAuthMapping(
  arboristUri: string,
  apiEndpoint: string,
  apiKey: string
): Promise<UserAuthMapping | null> {
  let accessToken = getAccessToken();

  if (!accessToken) {
    logout();
    return null;
  }

  // Try to get auth mapping
  let userAuthMapping = await fetchUserAuthMapping(arboristUri, accessToken);

  // If failed, try refreshing token
  if (!userAuthMapping) {
    console.log('Retrying after token refresh...');
    const refreshed = await refreshTokens(apiEndpoint, apiKey);

    if (!refreshed) {
      logout();
      return null;
    }

    accessToken = getAccessToken();
    userAuthMapping = await fetchUserAuthMapping(arboristUri, accessToken!);
  }

  return userAuthMapping;
}

/**
 * Fetch user authorization mapping
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
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user auth mapping:', error);
    return null;
  }
}
