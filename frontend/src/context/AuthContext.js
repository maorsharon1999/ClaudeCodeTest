import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { configureInterceptors } from '../api/client';
import { refreshToken as apiRefreshToken, deleteSession } from '../api/auth';

const REFRESH_TOKEN_KEY = 'bubble_refresh_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  // null = loading, false = no auth, true = authenticated
  const [authState, setAuthState] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const accessTokenRef = useRef(null);

  // Keep ref in sync with state so interceptors can read it synchronously
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const getAccessToken = useCallback(() => accessTokenRef.current, []);

  const doRefresh = useCallback(async () => {
    const storedRefresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!storedRefresh) {
      throw new Error('No refresh token');
    }
    const data = await apiRefreshToken(storedRefresh);
    const newAccess = data.access_token;
    setAccessToken(newAccess);
    accessTokenRef.current = newAccess;
    return newAccess;
  }, []);

  const onAuthFailure = useCallback(async () => {
    setAccessToken(null);
    accessTokenRef.current = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
    setAuthState(false);
  }, []);

  // Wire up axios interceptors once
  useEffect(() => {
    configureInterceptors({
      getAccessToken,
      refreshAccessToken: doRefresh,
      onAuthFailure,
    });
  }, [getAccessToken, doRefresh, onAuthFailure]);

  // On mount: attempt silent refresh from stored token
  useEffect(() => {
    async function init() {
      // AUTH FROZEN: skip token refresh, go straight into the app.
      // Restore the original try/catch block below when re-enabling auth.
      setProfileComplete(true);
      setAuthState(true);
      return;

      /* eslint-disable no-unreachable */
      try {
        await doRefresh();
        setAuthState(true);
      } catch {
        setAuthState(false);
      }
      /* eslint-enable no-unreachable */
    }
    init();
  }, [doRefresh]);

  const signIn = useCallback(async ({ access_token, refresh_token, profile_complete }) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh_token);
    setAccessToken(access_token);
    accessTokenRef.current = access_token;
    setProfileComplete(!!profile_complete);
    setAuthState(true);
  }, []);

  const markProfileComplete = useCallback(() => {
    setProfileComplete(true);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (storedRefreshToken) await deleteSession(storedRefreshToken);
    } catch {
      // Best-effort
    }
    setAccessToken(null);
    accessTokenRef.current = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
    setAuthState(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,      // null | false | true
        profileComplete,
        signIn,
        signOut,
        markProfileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
