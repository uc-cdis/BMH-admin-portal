import {
  getWorkspaces,
  getAdminWorkspaces,
  requestWorkspace,
  setWorkspaceLimits,
  approveWorkspace,
  callExternalURL,
  ApiError,
  type StridesGrantWorkspaceFormData,
} from '@/lib/api/workspace-api';
import { getAccessToken, refreshTokens, logout } from '@/lib/auth/oidc';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/lib/auth/oidc', () => ({
  getAccessToken: jest.fn(),
  refreshTokens: jest.fn(),
  logout: jest.fn(),
}));

const mockedGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockedRefreshTokens = refreshTokens as jest.MockedFunction<typeof refreshTokens>;
const mockedLogout = logout as jest.MockedFunction<typeof logout>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal Response-like object */
function makeResponse(
  body: any,
  status = 200,
  ok = true
): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

const mockWorkspacePayload = [
  {
    bmh_workspace_id: 'ws-001',
    user_id: 'user@example.com',
    request_status: 'active',
    workspace_type: 'STRIDES Credits',
  },
];

const mockGrantFormData: StridesGrantWorkspaceFormData = {
  workspace_type: 'STRIDES Grant',
  scientific_poc: 'Dr. Smith',
  poc_email: 'accounts@test.com',
  confirm_poc_email: 'accounts@test.com',
  internal_poc_email: 'smith@nih.gov',
  confirm_internal_poc_email: 'smith@nih.gov',
  scientific_institution_domain_name: 'nih.gov',
  nih_funded_award_number: '1A23BC012345-01',
  administering_nih_institute: 'NCI - National Cancer Institute',
  program_officer_approval: 'No',
  nih_program_official_name: 'Jane Doe',
  nih_program_official_email: 'jdoe@nih.gov',
  keywords: 'cancer genomics',
  ecs: true,
  summary_and_justification: 'Research summary',
  project_short_title: 'CancerStudy',
  rcdc: '',
  additional_poc_email: '',
  additional_poc_job_title: '',
  attestation: true,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('workspace-api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccessToken.mockReturnValue('mock-access-token');
    global.fetch = jest.fn();
  });

  describe('ApiError', () => {
    it('is an instance of Error', () => {
      const err = new ApiError('something went wrong', 500);
      expect(err).toBeInstanceOf(Error);
    });

    it('has name "ApiError"', () => {
      const err = new ApiError('something went wrong', 500);
      expect(err.name).toBe('ApiError');
    });

    it('stores status and message', () => {
      const err = new ApiError('Not found', 404);
      expect(err.message).toBe('Not found');
      expect(err.status).toBe(404);
    });

    it('stores optional response payload', () => {
      const payload = { detail: 'missing' };
      const err = new ApiError('Not found', 404, payload);
      expect(err.response).toEqual(payload);
    });
  });

  // ── Auth header / token handling ───────────────────────────────────────────

  describe('Auth header handling', () => {
    it('calls logout and throws when no access token is available', async () => {
      mockedGetAccessToken.mockReturnValue(null);
      await expect(getWorkspaces()).rejects.toThrow('No access token available');
      expect(mockedLogout).toHaveBeenCalled();
    });

    it('sends Authorization: Bearer header with the access token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(mockWorkspacePayload)
      );

      await getWorkspaces();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        })
      );
    });
  });

  describe('401 retry logic', () => {
    it('retries the call after a successful token refresh', async () => {
      mockedRefreshTokens.mockResolvedValue(true);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(makeResponse(null, 401, false))   // first call → 401
        .mockResolvedValueOnce(makeResponse(mockWorkspacePayload)); // retry → 200

      const result = await getWorkspaces();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockWorkspacePayload);
    });

    it('logs out when token refresh succeeds but retry still returns 401', async () => {
      mockedRefreshTokens.mockResolvedValue(true);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(makeResponse(null, 401, false))
        .mockResolvedValueOnce(makeResponse(null, 401, false));

      await getWorkspaces();
      expect(mockedLogout).toHaveBeenCalled();
    });

    it('throws ApiError when token refresh succeeds but retry returns a non-401 error', async () => {
      mockedRefreshTokens.mockResolvedValue(true);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(makeResponse(null, 401, false))
        .mockResolvedValueOnce(makeResponse(null, 500, false));

      await expect(getWorkspaces()).rejects.toThrow(ApiError);
    });

    it('logs out when token refresh fails', async () => {
      mockedRefreshTokens.mockResolvedValue(false);
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(null, 401, false)
      );

      await getWorkspaces();
      expect(mockedLogout).toHaveBeenCalled();
    });

    it('throws ApiError for non-401 error responses without retrying', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(null, 403, false)
      );

      await expect(getWorkspaces()).rejects.toThrow(ApiError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(mockedRefreshTokens).not.toHaveBeenCalled();
    });
  });

  describe('getWorkspaces', () => {
    it('calls the /workspaces endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(mockWorkspacePayload)
      );

      await getWorkspaces();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/workspaces'),
        expect.any(Object)
      );
    });

    it('returns parsed workspace array on 200', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(mockWorkspacePayload)
      );

      const result = await getWorkspaces();
      expect(result).toEqual(mockWorkspacePayload);
    });

    it('returns an empty array on 204 No Content', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(null, 204, true)
      );

      const result = await getWorkspaces();
      expect(result).toEqual([]);
    });
  });

  describe('getAdminWorkspaces', () => {
    it('calls the /workspaces/admin_all endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(mockWorkspacePayload)
      );

      await getAdminWorkspaces();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/workspaces/admin_all'),
        expect.any(Object)
      );
    });

    it('returns parsed workspace array on 200', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(mockWorkspacePayload)
      );

      const result = await getAdminWorkspaces();
      expect(result).toEqual(mockWorkspacePayload);
    });

    it('returns an empty array on 204 No Content', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(null, 204, true)
      );

      const result = await getAdminWorkspaces();
      expect(result).toEqual([]);
    });
  });

  describe('requestWorkspace', () => {
    it('calls POST /workspaces', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ id: 'ws-new' })
      );

      await requestWorkspace(mockGrantFormData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/workspaces'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends the form data as a JSON body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ id: 'ws-new' })
      );

      await requestWorkspace(mockGrantFormData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(mockGrantFormData),
        })
      );
    });

    it('returns the parsed response on success', async () => {
      const responsePayload = { id: 'ws-new', status: 'pending' };
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(responsePayload)
      );

      const result = await requestWorkspace(mockGrantFormData);
      expect(result).toEqual(responsePayload);
    });

    it('throws ApiError on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(null, 500, false)
      );

      await expect(requestWorkspace(mockGrantFormData)).rejects.toThrow(ApiError);
    });
  });

  describe('setWorkspaceLimits', () => {
    const limits = { spending_limit: 1000, compute_limit: 500 };

    it('calls PUT /workspaces/:id/limits', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse({ ok: true }));

      await setWorkspaceLimits('ws-001', limits);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/workspaces/ws-001/limits'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('sends limits as JSON body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse({ ok: true }));

      await setWorkspaceLimits('ws-001', limits);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify(limits) })
      );
    });

    it('returns parsed response on success', async () => {
      const responsePayload = { updated: true };
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse(responsePayload));

      const result = await setWorkspaceLimits('ws-001', limits);
      expect(result).toEqual(responsePayload);
    });

    it('throws ApiError on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(null, 403, false)
      );

      await expect(setWorkspaceLimits('ws-001', limits)).rejects.toThrow(ApiError);
    });
  });

  describe('approveWorkspace', () => {
    const accountPayload = { account_id: '123456789012' };

    it('calls POST /workspaces/:id/provision', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse({ ok: true }));

      await approveWorkspace('ws-001', accountPayload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/workspaces/ws-001/provision'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends the account payload as JSON body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse({ ok: true }));

      await approveWorkspace('ws-001', accountPayload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify(accountPayload) })
      );
    });

    it('accepts a plain string account ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse({ ok: true }));

      await approveWorkspace('ws-001', '123456789012');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify('123456789012') })
      );
    });

    it('returns parsed response on success', async () => {
      const responsePayload = { provisioned: true };
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse(responsePayload));

      const result = await approveWorkspace('ws-001', accountPayload);
      expect(result).toEqual(responsePayload);
    });

    it('throws ApiError on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(null, 400, false)
      );

      await expect(approveWorkspace('ws-001', accountPayload)).rejects.toThrow(ApiError);
    });
  });

  describe('callExternalURL', () => {
    const externalUrl = 'https://external.example.com/api/data';

    it('makes a GET request by default', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ data: 'value' })
      );

      await callExternalURL(externalUrl);

      expect(global.fetch).toHaveBeenCalledWith(
        externalUrl,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('does not send a body for GET requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ data: 'value' })
      );

      await callExternalURL(externalUrl, 'GET');

      expect(global.fetch).toHaveBeenCalledWith(
        externalUrl,
        expect.objectContaining({ body: undefined })
      );
    });

    it('sends body as JSON for POST requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ created: true })
      );

      const data = { key: 'value' };
      await callExternalURL(externalUrl, 'POST', {}, data);

      expect(global.fetch).toHaveBeenCalledWith(
        externalUrl,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });

    it('returns parsed JSON response', async () => {
      const responsePayload = { result: 42 };
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(responsePayload)
      );

      const result = await callExternalURL(externalUrl);
      expect(result).toEqual(responsePayload);
    });

    it('calls logout and throws when no access token is available', async () => {
      mockedGetAccessToken.mockReturnValue(null);

      await expect(callExternalURL(externalUrl)).rejects.toThrow(
        'No access token available'
      );
      expect(mockedLogout).toHaveBeenCalled();
    });

    it('supports PUT, DELETE, and PATCH methods', async () => {
      for (const method of ['PUT', 'DELETE', 'PATCH'] as const) {
        jest.clearAllMocks();
        mockedGetAccessToken.mockReturnValue('mock-access-token');
        (global.fetch as jest.Mock).mockResolvedValue(makeResponse({ ok: true }));

        await callExternalURL(externalUrl, method, {}, { id: 1 });

        expect(global.fetch).toHaveBeenCalledWith(
          externalUrl,
          expect.objectContaining({ method })
        );
      }
    });

    it('throws when the fetch network call rejects', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(callExternalURL(externalUrl)).rejects.toThrow('Network error');
    });
  });
});
