'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isAuthenticated,
  getName,
  initiateLogin,
  logout as performLogout,
  getAccessToken,
  refreshTokens,
} from '@/lib/auth/oidc';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authed = isAuthenticated();
      setAuthenticated(authed);

      if (authed) {
        setUserName(getName());
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(() => {
    initiateLogin(
      process.env.NEXT_PUBLIC_OIDC_AUTH_URI!,
      process.env.NEXT_PUBLIC_OIDC_CLIENT_ID!,
      process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI!,
      process.env.NEXT_PUBLIC_AUTH_SERVICE!
    );
  }, []);

  const logout = useCallback(() => {
    performLogout();
  }, []);

  const getToken = useCallback(() => {
    return getAccessToken();
  }, []);

  const refresh = useCallback(async () => {
    const success = await refreshTokens();
    if (success) {
      // Update state
      setAuthenticated(isAuthenticated());
      setUserName(getName());
    }
    return success;
  }, []);

  return {
    authenticated,
    userName,
    loading,
    login,
    logout,
    getToken,
    refresh,
  };
}
