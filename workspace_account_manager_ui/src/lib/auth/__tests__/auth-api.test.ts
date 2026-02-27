import { exchangeCodeForTokens, refreshTokens } from '@/lib/auth/auth-api';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEST_API_ENDPOINT = 'https://api.example.com';
const TEST_API_KEY = 'test-api-key-123'; // pragma: allowlist secret
const TEST_AUTH_CODE = 'auth-code-abc';
const TEST_REFRESH_TOKEN = 'refresh-token-xyz';

const mockTokenSet = {
  id_token: 'mock-id-token',
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResponse(body: object, status = 200, statusText = 'OK'): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('auth-api', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exchangeCodeForTokens', () => {
    describe('request shape', () => {
      beforeEach(() => {
        (global.fetch as jest.Mock).mockResolvedValue(makeResponse(mockTokenSet));
      });

      it('calls the correct URL with the code as a query param', async () => {
        await exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(global.fetch).toHaveBeenCalledWith(
          `${TEST_API_ENDPOINT}/auth/get-tokens?code=${TEST_AUTH_CODE}`,
          expect.any(Object)
        );
      });

      it('sends Content-Type: application/json header', async () => {
        await exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });

      it('sends the X-Api-Key header', async () => {
        await exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Api-Key': TEST_API_KEY,
            }),
          })
        );
      });

      it('uses GET (no method override)', async () => {
        await exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY);

        // fetch called without a method field means default GET
        const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.method).toBeUndefined();
      });
    });

    describe('successful response', () => {
      it('returns the token set from the response body', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(makeResponse(mockTokenSet));

        const result = await exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(result).toEqual({
          id_token: mockTokenSet.id_token,
          access_token: mockTokenSet.access_token,
          refresh_token: mockTokenSet.refresh_token,
        });
      });

      it('only returns the three expected token fields', async () => {
        const responseWithExtraFields = {
          ...mockTokenSet,
          expires_in: 3600,
          token_type: 'Bearer',
        };
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse(responseWithExtraFields)
        );

        const result = await exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(Object.keys(result)).toEqual(['id_token', 'refresh_token', 'access_token']);
      });
    });

    describe('error handling', () => {
      it('throws when response is not ok (400)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse({}, 400, 'Bad Request')
        );

        await expect(
          exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Failed to exchange code for tokens: Bad Request');
      });

      it('throws when response is not ok (401)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse({}, 401, 'Unauthorized')
        );

        await expect(
          exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Failed to exchange code for tokens: Unauthorized');
      });

      it('throws when response is not ok (500)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse({}, 500, 'Internal Server Error')
        );

        await expect(
          exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Failed to exchange code for tokens: Internal Server Error');
      });

      it('includes the statusText in the error message', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse({}, 403, 'Forbidden')
        );

        await expect(
          exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Forbidden');
      });

      it('propagates network-level fetch errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

        await expect(
          exchangeCodeForTokens(TEST_AUTH_CODE, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Network failure');
      });
    });
  });

  describe('refreshTokens', () => {
    describe('request shape', () => {
      beforeEach(() => {
        (global.fetch as jest.Mock).mockResolvedValue(makeResponse(mockTokenSet));
      });

      it('calls the correct URL', async () => {
        await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(global.fetch).toHaveBeenCalledWith(
          `${TEST_API_ENDPOINT}/auth/refresh-tokens`,
          expect.any(Object)
        );
      });

      it('uses the PUT method', async () => {
        await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: 'PUT' })
        );
      });

      it('sends Content-Type: application/json header', async () => {
        await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });

      it('sends the X-Api-Key header', async () => {
        await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Api-Key': TEST_API_KEY,
            }),
          })
        );
      });

      it('sends the refresh token in the request body', async () => {
        await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ refresh_token: TEST_REFRESH_TOKEN }),
          })
        );
      });

      it('does not include the refresh token as a query param', async () => {
        await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
        expect(url).not.toContain(TEST_REFRESH_TOKEN);
      });
    });

    describe('successful response', () => {
      it('returns the token set from the response body', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(makeResponse(mockTokenSet));

        const result = await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(result).toEqual({
          id_token: mockTokenSet.id_token,
          access_token: mockTokenSet.access_token,
          refresh_token: mockTokenSet.refresh_token,
        });
      });

      it('only returns the three expected token fields', async () => {
        const responseWithExtraFields = {
          ...mockTokenSet,
          expires_in: 3600,
          token_type: 'Bearer',
        };
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse(responseWithExtraFields)
        );

        const result = await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(Object.keys(result)).toEqual(['id_token', 'refresh_token', 'access_token']);
      });

      it('returns a new refresh token if the server rotates it', async () => {
        const rotatedTokenSet = {
          ...mockTokenSet,
          refresh_token: 'new-rotated-refresh-token',
        };
        (global.fetch as jest.Mock).mockResolvedValue(makeResponse(rotatedTokenSet));

        const result = await refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY);

        expect(result.refresh_token).toBe('new-rotated-refresh-token');
      });
    });

    describe('error handling', () => {
      it('throws when response is not ok (401)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse({}, 401, 'Unauthorized')
        );

        await expect(
          refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Failed to refresh tokens: Unauthorized');
      });

      it('throws when response is not ok (400)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse({}, 400, 'Bad Request')
        );

        await expect(
          refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Failed to refresh tokens: Bad Request');
      });

      it('throws when response is not ok (500)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse({}, 500, 'Internal Server Error')
        );

        await expect(
          refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Failed to refresh tokens: Internal Server Error');
      });

      it('includes the statusText in the error message', async () => {
        (global.fetch as jest.Mock).mockResolvedValue(
          makeResponse({}, 503, 'Service Unavailable')
        );

        await expect(
          refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Service Unavailable');
      });

      it('propagates network-level fetch errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

        await expect(
          refreshTokens(TEST_REFRESH_TOKEN, TEST_API_ENDPOINT, TEST_API_KEY)
        ).rejects.toThrow('Network failure');
      });
    });
  });
});
