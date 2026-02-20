import { getAccessToken, refreshTokens, logout } from '@/lib/auth/oidc';

/**
 * API Configuration
 */
const baseUrl = process.env.NEXT_PUBLIC_API_GW_ENDPOINT || '';

/**
 * API Response type
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  response?: any;

  constructor(message: string, status: number, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

/**
 * Helper method to handle API calls and refresh token if we receive a
 * 401 Unauthorized response from the API. This should be used to call all
 * backend API endpoints.
 *
 * @param apiCall - Async function used to make actual API call to backend
 * @param callback - Success callback function used to handle response from API call
 */
async function makeApiCall<T>(
  apiCall: () => Promise<Response>,
  callback: (response: Response) => Promise<T>
): Promise<T | void> {
  const response = await apiCall();

  if (response.ok) {
    return await callback(response);
  } else if (response.status === 401) {
    /* Invalid Token, refresh. If this fails, the user logs out */
    console.log('Token invalid, attempting refresh...');

    const refreshed = await refreshTokens();

    if (refreshed) {
      const retryResponse = await apiCall();

      if (retryResponse.ok) {
        return await callback(retryResponse);
      } else if (retryResponse.status === 401) {
        // The token is still no good. Logout.
        console.error('Token refresh failed, logging out');
        logout();
      } else {
        console.error('Error calling API after retry');
        throw new ApiError('API call failed after retry', retryResponse.status);
      }
    } else {
      console.error('Token refresh failed, logging out');
      logout();
    }
  } else {
    console.error('Error calling API');
    throw new ApiError('API call failed', response.status);
  }
}

/**
 * Build headers for authenticated requests
 */
function buildAuthHeaders(): HeadersInit {
  const accessToken = getAccessToken();

  if (!accessToken) {
    console.error('Error getting access token');
    logout();
    throw new Error('No access token available');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
}

// ============================================================================
// WORKSPACE API ENDPOINTS
// ============================================================================

/**
 * Workspace type definitions
 */
type RequestStatus = "active" | "pending" | "suspended" | "terminated" | "provisioning" | "failed" | "erronous";

export interface Workspace {
  bmh_workspace_id: string;
  user_id: string;
  account_id?: string;
  request_status: RequestStatus
  workspace_type: string;
  'total-usage'?: number;
  'soft-limit': number;
  'hard-limit': number;
  'strides-credits'?: number;
  direct_pay_limit?: number;
  root_account_email?: string;
  ecs?: string;
  subnet?: string;
  scientific_poc?: string;
}

export interface StridesGrantWorkspaceFormData {
  workspace_type: string,
  scientific_poc: string,
  poc_email: string,
  confirm_poc_email: string,
  internal_poc_email: string,
  confirm_internal_poc_email: string,
  scientific_institution_domain_name: string,
  nih_funded_award_number: string,
  administering_nih_institute: string,
  program_officer_approval: string,
  nih_program_official_name: string,
  nih_program_official_email: string,
  keywords: string,
  ecs: boolean,
  summary_and_justification: string,
  project_short_title: string
  rcdc: string,
  additional_poc_email: string,
  additional_poc_job_title: string,
  attestation: boolean
}

export interface StridesCreditsWorkspaceFormData {
  workspace_type: string,
  scientific_poc: string,
  poc_email: string,
  confirm_poc_email: string,
  internal_poc_email: string,
  confirm_internal_poc_email: string,
  scientific_institution_domain_name: string,
  nih_funded_award_number: string,
  administering_nih_institute: string,
  intramural: boolean,
  ecs: boolean,
  summary_and_justification: string,
  project_short_title: string
  attestation: boolean
}

export interface DirectPayWorkspaceFormData {
  workspace_type: string,
  ecs: boolean,
  summary_and_justification: string,
  project_short_title: string
}

/**
 * Get list of workspaces for current user
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  // const activeStatus: RequestStatus = "active"
  // const pendingStatus: RequestStatus = "pending"
  // const testData = [{
  //   "total-usage": 116.73,
  //   "strides-credits": 150,
  //   "hard-limit": 125,
  //   "user_id": "researcher@university.edu",
  //   "bmh_workspace_id": "2bbdfd3b-b402-47a2-b244-b0b053dde101",
  //   "soft-limit": 50,
  //   "request_status": activeStatus,
  //   "workspace_type": "STRIDES Grant",
  //   "nih_funded_award_number": "4325534543"
  // },
  // {
  //   "total-usage": 216.73,
  //   "strides-credits": 250,
  //   "hard-limit": 225,
  //   "user_id": "researcher@university.edu",
  //   "bmh_workspace_id": "2bbdfd3b-b402-47a2-b244-b0b053dde12",
  //   "soft-limit": 150,
  //   "request_status": activeStatus,
  //   "workspace_type": "STRIDES Credits",
  //   "nih_funded_award_number": "4325534543"
  // }, {
  //   "total-usage": 316.73,
  //   "strides-credits": 350,
  //   "hard-limit": 325,
  //   "user_id": "researcher@university.edu",
  //   "bmh_workspace_id": "2bbdfd3b-b402-47a2-b244-b0b053dde103",
  //   "soft-limit": 150,
  //   "request_status": pendingStatus,
  //   "workspace_type": "STRIDES Credits",
  //   "nih_funded_award_number": "4325534543"
  // }, {
  //   "total-usage": 416.73,
  //   "strides-credits": 450,
  //   "hard-limit": 425,
  //   "user_id": "researcher@university.edu",
  //   "bmh_workspace_id": "2bbdfd3b-b402-47a2-b244-b0b053dde104",
  //   "soft-limit": 150,
  //   "request_status": pendingStatus,
  //   "workspace_type": "Direct Pay",
  //   "nih_funded_award_number": "4325534543"
  // }
  // ];
  // return Promise.resolve(testData);
  return makeApiCall(
    async () => {
      const api = `${baseUrl}/workspaces`;
      const headers = buildAuthHeaders();
      return await fetch(api, { headers });
    },
    async (resp) => {
      let data: Workspace[] = [];
      // 204 No Content
      if (resp.status !== 204) {
        data = await resp.json();
      }
      return data;
    }
  ) as Promise<Workspace[]>;
}

/**
 * Get all workspaces (admin only)
 */
export async function getAdminWorkspaces(): Promise<Workspace[]> {
  return makeApiCall(
    async () => {
      const api = `${baseUrl}/workspaces/admin_all`;
      const headers = buildAuthHeaders();
      return await fetch(api, { headers });
    },
    async (resp) => {
      let data: Workspace[] = [];
      // 204 No Content
      if (resp.status !== 204) {
        console.log('Awaiting data, status: ' + resp.status);
        data = await resp.json();
      }
      return data;
    }
  ) as Promise<Workspace[]>;
}

/**
 * Request new workspace
 */
export async function requestWorkspace(
  formData: StridesGrantWorkspaceFormData | StridesCreditsWorkspaceFormData | DirectPayWorkspaceFormData
): Promise<any> {
  return makeApiCall(
    async () => {
      const api = `${baseUrl}/workspaces`;
      const headers = buildAuthHeaders();

      return await fetch(api, {
        method: 'POST',
        body: JSON.stringify(formData),
        headers,
      });
    },
    async (resp) => {
      return await resp.json();
    }
  );
}

/**
 * Set workspace limits (admin only)
 */
export async function setWorkspaceLimits(
  workspaceId: string,
  limits: {
    spending_limit?: number;
    compute_limit?: number;
    [key: string]: any;
  }
): Promise<any> {
  return makeApiCall(
    async () => {
      const api = `${baseUrl}/workspaces/${workspaceId}/limits`;
      const headers = buildAuthHeaders();

      return await fetch(api, {
        method: 'PUT',
        body: JSON.stringify(limits),
        headers,
      });
    },
    async (resp) => {
      return await resp.json();
    }
  );
}

/**
 * Approve workspace (admin only)
 */
export async function approveWorkspace(
  workspaceId: string,
  accountId: { account_id: string } | string
): Promise<any> {
  return makeApiCall(
    async () => {
      const api = `${baseUrl}/workspaces/${workspaceId}/provision`;
      const headers = buildAuthHeaders();

      return await fetch(api, {
        method: 'POST',
        body: JSON.stringify(accountId),
        headers,
      });
    },
    async (resp) => {
      return await resp.json();
    }
  );
}

/**
 * Call external URL with authentication
 * Generic method for making authenticated requests to external endpoints
 */
export async function callExternalURL<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  headers: HeadersInit = {},
  data?: any
): Promise<T> {
  return makeApiCall(
    async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        console.error('Error getting access token before calling external URL');
        logout();
        throw new Error('No access token available');
      }

      console.log('Request:', {
        url,
        method,
        headers,
        body: method === 'GET' ? undefined : data,
      });

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: method === 'GET' ? undefined : JSON.stringify(data),
        });

        if (!response.ok) {
          console.error(`Request failed with status ${response.status}`);
        } else {
          console.log('Response received:', response);
        }

        return response;
      } catch (error) {
        console.error('Network error:', error);
        throw error;
      }
    },
    async (resp) => {
      return await resp.json();
    }
  ) as Promise<T>;
}

/**
 * Default export with all API functions
 */
const workspaceAPIClient = {
  getWorkspaces,
  getAdminWorkspaces,
  requestWorkspace,
  setWorkspaceLimits,
  approveWorkspace,
  callExternalURL,
  ApiError,
};

export default workspaceAPIClient;
