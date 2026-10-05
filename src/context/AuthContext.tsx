// src/context/AuthContext.tsx
// Global authentication state — cart/wishlist live in shopStore so badge
// updates never re-render product grids or other screens.

import React, {createContext, useState, useEffect, useMemo, useCallback, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearCart, hydrateShopStore} from '../store/shopStore';
import {ENDPOINTS} from '../config/api';

export type User = {
  id: string;
  username: string;
  email: string;
};

export type RegisteredUser = User & { password: string };

export type AuthContextType = {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  keepSignedIn: boolean;
  signIn: (email: string, password: string, keepSigned?: boolean) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signInAsGuest: () => void;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [users, setUsers] = useState<RegisteredUser[]>([]);

  const STORAGE_KEYS = {
    users: 'APP_users',
    currentUser: 'APP_currentUser',
    isGuest: 'APP_isGuest',
    keepSignedIn: 'APP_keepSignedIn',
  };

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [usersRaw, userRaw, guestRaw, keepSignedInRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.users),
          AsyncStorage.getItem(STORAGE_KEYS.currentUser),
          AsyncStorage.getItem(STORAGE_KEYS.isGuest),
          AsyncStorage.getItem(STORAGE_KEYS.keepSignedIn),
          hydrateShopStore(),
        ]);

        if (usersRaw) {
          setUsers(JSON.parse(usersRaw));
        }
        if (userRaw && keepSignedInRaw === 'true') {
          setUser(JSON.parse(userRaw));
          setKeepSignedIn(true);
        }
        if (guestRaw) {
          setIsGuest(guestRaw === 'true');
        }
      } catch (err) {
        console.error('Failed to load stored data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user)).catch(console.error);
      AsyncStorage.setItem(STORAGE_KEYS.isGuest, String(isGuest)).catch(console.error);
      AsyncStorage.setItem(STORAGE_KEYS.keepSignedIn, String(keepSignedIn)).catch(console.error);
    }
  }, [user, isGuest, keepSignedIn, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users)).catch(console.error);
    }
  }, [users, isLoading]);

  const signIn = useCallback(async (email: string, password: string, keepSigned?: boolean) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      console.log(`[AUTH] Attempting Sign In to: ${ENDPOINTS.SIGN_IN}`);
      const response = await fetch(ENDPOINTS.SIGN_IN, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('[AUTH] Failed to parse JSON response:', text);
        throw new Error('Server returned an invalid response format.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      const signedInUser: User = data.user;
      setUser(signedInUser);
      setIsGuest(false);
      setKeepSignedIn(!!keepSigned);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[AUTH] Sign In Error:', err);
      if (err.name === 'AbortError') {
        throw new Error(`Connection timed out reaching ${ENDPOINTS.SIGN_IN}. Is the backend running?`);
      }
      throw new Error(err.message || 'Could not connect to authentication server');
    }
  }, []);

  const signUp = useCallback(async (username: string, email: string, password: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      console.log(`[AUTH] Attempting Sign Up to: ${ENDPOINTS.SIGN_UP}`);
      const response = await fetch(ENDPOINTS.SIGN_UP, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, email, password}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('[AUTH] Failed to parse JSON response:', text);
        throw new Error('Server returned an invalid response format.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      const newUser: User = data.user;
      setUser(newUser);
      setIsGuest(false);
      clearCart();
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[AUTH] Sign Up Error:', err);
      if (err.name === 'AbortError') {
        throw new Error(`Connection timed out reaching ${ENDPOINTS.SIGN_UP}. Is the backend running?`);
      }
      throw new Error(err.message || 'Could not connect to authentication server');
    }
  }, []);

  const signInAsGuest = useCallback(() => {
    setUser(null);
    setIsGuest(true);
    clearCart();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsGuest(false);
    clearCart();
    setKeepSignedIn(false);
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    const foundIndex = users.findIndex(u => u.email === email);
    if (foundIndex === -1) {
      throw new Error('Email not found');
    }
    const updatedUsers = [...users];
    updatedUsers[foundIndex] = {...updatedUsers[foundIndex], password: newPassword};
    setUsers(updatedUsers);
  }, [users]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isGuest,
    isLoading,
    keepSignedIn,
    signIn,
    signUp,
    signInAsGuest,
    logout,
    resetPassword,
  }), [user, isGuest, isLoading, keepSignedIn, signIn, signUp, signInAsGuest, logout, resetPassword]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
