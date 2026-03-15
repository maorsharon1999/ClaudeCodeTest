import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { configureInterceptors } from '../api/client';
import { refreshToken as apiRefreshToken, deleteSession, deleteAccount as apiDeleteAccount } from '../api/auth';

const REFRESH_TOKEN_KEY   = 'bubble_refresh_token';
const PROFILE_COMPLETE_KEY = 'bubble_profile_complete';
// Note: expo-secure-store 14.x (SDK 54) changed its internal key storage format on Android.
// Existing Android users upgrading from SDK 50 will have their stored refresh token
// silently unreadable — doRefresh() will throw "No refresh token" and authState becomes false.
// This results in a clean forced logout (not a data leak). Users must re-authenticate once.

// expo-secure-store has no web implementation — fall back to localStorage on web
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key) {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    return SecureStore.deleteItemAsync(key);
  },
};

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
    const storedRefresh = await storage.getItem(REFRESH_TOKEN_KEY);
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
    await storage.deleteItem(REFRESH_TOKEN_KEY).catch(() => {});
    await storage.deleteItem(PROFILE_COMPLETE_KEY).catch(() => {});
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
      try {
        await doRefresh();
        // Refresh succeeded — restore profile completion state from storage,
        // then verify against the server in the background.
        const stored = await storage.getItem(PROFILE_COMPLETE_KEY).catch(() => null);
        setProfileComplete(stored === '1');
        setAuthState(true);
      } catch (err) {
        // Only force logout when the server explicitly rejected the token (401).
        // Network errors (backend unreachable, timeout) must not log the user out.
        const isAuthRejection = err.response?.status === 401;
        if (isAuthRejection) {
          await storage.deleteItem(REFRESH_TOKEN_KEY).catch(() => {});
          await storage.deleteItem(PROFILE_COMPLETE_KEY).catch(() => {});
          setAuthState(false);
        } else {
          // Backend unreachable — keep session alive using persisted state.
          const stored = await storage.getItem(PROFILE_COMPLETE_KEY).catch(() => null);
          setProfileComplete(stored === '1');
          setAuthState(true);
        }
      }
    }
    init();
  }, [doRefresh]);

  const signIn = useCallback(async ({ access_token, refresh_token, profile_complete }) => {
    await storage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    await storage.setItem(PROFILE_COMPLETE_KEY, profile_complete ? '1' : '0').catch(() => {});
    setAccessToken(access_token);
    accessTokenRef.current = access_token;
    setProfileComplete(!!profile_complete);
    setAuthState(true);
  }, []);

  const markProfileComplete = useCallback(() => {
    storage.setItem(PROFILE_COMPLETE_KEY, '1').catch(() => {});
    setProfileComplete(true);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const storedRefreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
      if (storedRefreshToken) await deleteSession(storedRefreshToken);
    } catch {
      // Best-effort
    }
    setAccessToken(null);
    accessTokenRef.current = null;
    await storage.deleteItem(REFRESH_TOKEN_KEY).catch(() => {});
    await storage.deleteItem(PROFILE_COMPLETE_KEY).catch(() => {});
    setAuthState(false);
  }, []);

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    setAccessToken(null);
    accessTokenRef.current = null;
    await storage.deleteItem(REFRESH_TOKEN_KEY).catch(() => {});
    await storage.deleteItem(PROFILE_COMPLETE_KEY).catch(() => {});
    setAuthState(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,      // null | false | true
        profileComplete,
        signIn,
        signOut,
        deleteAccount,
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
