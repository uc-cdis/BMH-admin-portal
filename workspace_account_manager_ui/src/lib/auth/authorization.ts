'use client';

import { getAccessToken, getRefreshToken, refreshTokens, logout } from './oidc';
import config from '../../../config.json'

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

const resources = config['authorization']['resources']

/**
 * Check admin authorization (client-side)
 */
export async function authorizeAdmin(): Promise<boolean> {
  const userAuthMapping = await getUserAuthMapping();
  return authorize(resources['ADMIN'], userAuthMapping);
}

/**
 * Check if user is authorized to request STRIDES credits
 */
export async function authorizeCredits(): Promise<boolean> {
  const userAuthMapping = await getUserAuthMapping();
  return authorize(resources['CREDITS'], userAuthMapping);
}

/**
 * Check if user is authorized to request STRIDES grants
 */
export async function authorizeGrants(): Promise<boolean> {
  const userAuthMapping = await getUserAuthMapping();
  return authorize(resources['GRANTS'], userAuthMapping);
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
async function getUserAuthMapping(): Promise<UserAuthMapping | null> {
  let accessToken = getAccessToken();

  if (!accessToken) {
    logout();
    return null;
  }

  // Try to get auth mapping
  let userAuthMapping = await fetchUserAuthMapping();

  // If failed, try refreshing token
  if (!userAuthMapping) {
    console.log('Retrying after token refresh...');
    const refreshed = await refreshTokens();

    if (!refreshed) {
      logout();
      return null;
    }

    accessToken = getAccessToken();
    userAuthMapping = await fetchUserAuthMapping();
  }

  return userAuthMapping;
}

/**
 * Fetch user authorization mapping
 */
async function fetchUserAuthMapping(
): Promise<UserAuthMapping | null> {
  try {
    const arboristUri = process.env.NEXT_PUBLIC_ARBORIST_URI!
    const accessToken = getAccessToken()
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
