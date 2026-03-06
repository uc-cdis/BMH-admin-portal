import { authorizeAdmin, authorizeCredits, authorizeGrants } from '@/lib/auth/authorization';
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

function makeResponse(body: object, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 403,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

/**
 * Build a UserAuthMapping that grants access to the given resource + service.
 */
function makeAuthMapping(resource: string, service: string, method = 'access') {
  return { [resource]: [{ method, service }] };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_ARBORIST_URI = 'https://arborist.example.com/user';
    mockedGetAccessToken.mockReturnValue('mock-access-token');
    global.fetch = jest.fn();
  });

  describe('token handling', () => {
    it('calls logout and returns false when no access token is available', async () => {
      mockedGetAccessToken.mockReturnValue(null);

      const result = await authorizeAdmin();

      expect(mockedLogout).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('does not call fetch when no access token is available', async () => {
      mockedGetAccessToken.mockReturnValue(null);

      await authorizeAdmin();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('sends Authorization: Bearer header to Arborist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_admin', 'workspace_stride_admin'))
      );

      await authorizeAdmin();

      expect(global.fetch).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_ARBORIST_URI,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        })
      );
    });

    it('sends Content-Type: application/json header to Arborist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_admin', 'workspace_stride_admin'))
      );

      await authorizeAdmin();

      expect(global.fetch).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_ARBORIST_URI,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('retries fetch after a successful token refresh when first fetch returns null', async () => {
      mockedRefreshTokens.mockResolvedValue(true);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(makeResponse({}, false))   // first attempt → not ok → null
        .mockResolvedValueOnce(                           // retry after refresh → granted
          makeResponse(makeAuthMapping('/workspace_stride_admin', 'workspace_stride_admin'))
        );

      const result = await authorizeAdmin();

      expect(mockedRefreshTokens).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });

    it('calls logout and returns false when token refresh fails', async () => {
      mockedRefreshTokens.mockResolvedValue(false);
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse({}, false));

      const result = await authorizeAdmin();

      expect(mockedLogout).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('returns false when retry fetch also fails after token refresh', async () => {
      mockedRefreshTokens.mockResolvedValue(true);
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse({}, false));

      const result = await authorizeAdmin();

      expect(result).toBe(false);
    });

    it('returns false and does not throw when fetch throws a network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      const result = await authorizeAdmin();

      expect(result).toBe(false);
    });
  });

  describe('authorize() logic', () => {
    it('returns false when userAuthMapping is null', async () => {
      // No token → getUserAuthMapping returns null
      mockedGetAccessToken.mockReturnValue(null);

      const result = await authorizeAdmin();
      expect(result).toBe(false);
    });

    it('returns false when resource is not present in the mapping', async () => {
      // Mapping exists but does not contain /workspace_stride_admin
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ '/other-resource': [{ method: 'access', service: 'workspace_stride_admin' }] })
      );

      const result = await authorizeAdmin();
      expect(result).toBe(false);
    });

    it('returns false when service name does not match', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ '/workspace_stride_admin': [{ method: 'access', service: 'wrong-service' }] })
      );

      const result = await authorizeAdmin();
      expect(result).toBe(false);
    });

    it('returns false when method is not "access"', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ '/workspace_stride_admin': [{ method: 'read', service: 'workspace_stride_admin' }] })
      );

      const result = await authorizeAdmin();
      expect(result).toBe(false);
    });

    it('returns true when resource, service, and method all match', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_admin', 'workspace_stride_admin'))
      );

      const result = await authorizeAdmin();
      expect(result).toBe(true);
    });

    it('returns true when mapping has multiple services and one matches', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({
          '/workspace_stride_admin': [
            { method: 'read', service: 'workspace_stride_admin' },
            { method: 'access', service: 'workspace_stride_admin' },  // this one matches
            { method: 'write', service: 'workspace_stride_admin' },
          ],
        })
      );

      const result = await authorizeAdmin();
      expect(result).toBe(true);
    });

    it('returns false when mapping has multiple services but none match exactly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({
          '/workspace_stride_admin': [
            { method: 'read', service: 'workspace_stride_admin' },
            { method: 'access', service: 'wrong-service' },
          ],
        })
      );

      const result = await authorizeAdmin();
      expect(result).toBe(false);
    });
  });

  describe('authorizeAdmin', () => {
    it('returns true when user has admin access', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_admin', 'workspace_stride_admin'))
      );

      expect(await authorizeAdmin()).toBe(true);
    });

    it('returns false when user has credits but not admin access', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_credits', 'workspace_stride_credits'))
      );

      expect(await authorizeAdmin()).toBe(false);
    });
  });

  describe('authorizeCredits', () => {
    it('returns true when user has credits access', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_credits', 'workspace_stride_credits'))
      );

      expect(await authorizeCredits()).toBe(true);
    });

    it('returns false when user has admin but not credits access', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_admin', 'workspace_stride_admin'))
      );

      expect(await authorizeCredits()).toBe(false);
    });
  });

  describe('authorizeGrants', () => {
    it('returns true when user has grants access', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_grants', 'workspace_stride_grants'))
      );

      expect(await authorizeGrants()).toBe(true);
    });

    it('returns false when user has credits but not grants access', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse(makeAuthMapping('/workspace_stride_credits', 'workspace_stride_credits'))
      );

      expect(await authorizeGrants()).toBe(false);
    });
  });

  describe('multiple resources in mapping', () => {
    it('each authorize function only checks its own resource', async () => {
      // Mapping grants access to all three resources
      const fullMapping = {
        '/workspace_stride_admin': [{ method: 'access', service: 'workspace_stride_admin' }],
        '/workspace_stride_credits': [{ method: 'access', service: 'workspace_stride_credits' }],
        '/workspace_stride_grants': [{ method: 'access', service: 'workspace_stride_grants' }],
      };

      (global.fetch as jest.Mock).mockResolvedValue(makeResponse(fullMapping));
      expect(await authorizeAdmin()).toBe(true);

      jest.clearAllMocks();
      mockedGetAccessToken.mockReturnValue('mock-access-token');
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse(fullMapping));
      expect(await authorizeCredits()).toBe(true);

      jest.clearAllMocks();
      mockedGetAccessToken.mockReturnValue('mock-access-token');
      (global.fetch as jest.Mock).mockResolvedValue(makeResponse(fullMapping));
      expect(await authorizeGrants()).toBe(true);
    });

    it('returns false for a resource not in a partial mapping', async () => {
      // Only admin in the mapping
      (global.fetch as jest.Mock).mockResolvedValue(
        makeResponse({ '/workspace_stride_admin': [{ method: 'access', service: 'workspace_stride_admin' }] })
      );

      expect(await authorizeGrants()).toBe(false);
    });
  });
});
