interface TokenSet {
  id_token: string;
  access_token: string;
  refresh_token: string;
}

/**
 * Exchange authorization code for tokens via backend API
 */
export async function exchangeCodeForTokens(
  code: string,
  apiEndpoint: string,
  apiKey: string
): Promise<TokenSet> {
  const response = await fetch(
    `${apiEndpoint}/auth/get-tokens?code=${code}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id_token: data.id_token,
    refresh_token: data.refresh_token,
    access_token: data.access_token,
  };
}

/**
 * Refresh tokens using refresh token via backend API
 */
export async function refreshTokens(
  refreshToken: string,
  apiEndpoint: string,
  apiKey: string
): Promise<TokenSet> {
  const response = await fetch(`${apiEndpoint}/auth/refresh-tokens`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh tokens: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id_token: data.id_token,
    refresh_token: data.refresh_token,
    access_token: data.access_token,
  };
}
