'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, gdprApi, User, ApiError } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  needsTermsAcceptance: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  acceptTerms: () => Promise<void>;
  declineTerms: () => void;
  updateUser: (data: Partial<User>) => void;
  mustChangePassword: boolean;
  hasAcceptedTerms: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true,
    needsTermsAcceptance: false,
  });

  // Restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const refreshTokenStored = localStorage.getItem('refreshToken');
    const userStored = localStorage.getItem('user');

    if (token && userStored) {
      try {
        const user = JSON.parse(userStored);
        setState({
          user,
          token,
          refreshToken: refreshTokenStored,
          isLoading: false,
          needsTermsAcceptance: !user.acceptedTermsAt,
        });
      } catch {
        localStorage.clear();
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    const { user, tokens } = data;
    const token = tokens.accessToken;
    const refreshTokenValue = tokens.refreshToken;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshTokenValue);
    localStorage.setItem('user', JSON.stringify(user));

    setState({
      user,
      token,
      refreshToken: refreshTokenValue,
      isLoading: false,
      needsTermsAcceptance: !user.acceptedTermsAt,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setState({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      needsTermsAcceptance: false,
    });
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!state.token || !state.user) throw new Error('Not authenticated');
    await authApi.changePassword(currentPassword, newPassword, state.token);

    const updatedUser = { ...state.user, mustChangePassword: false };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setState(prev => ({ ...prev, user: updatedUser }));
  }, [state.token, state.user]);

  const acceptTerms = useCallback(async () => {
    if (!state.token || !state.user) throw new Error('Not authenticated');
    await gdprApi.acceptTerms('1.0', state.token);

    const updatedUser = { ...state.user, acceptedTermsAt: new Date().toISOString() };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setState(prev => ({
      ...prev,
      user: updatedUser,
      needsTermsAcceptance: false,
    }));
  }, [state.token, state.user]);

  const declineTerms = useCallback(() => {
    logout();
  }, [logout]);

  const updateUser = useCallback((data: Partial<User>) => {
    if (!state.user) return;
    const updatedUser = { ...state.user, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setState(prev => ({ ...prev, user: updatedUser }));
  }, [state.user]);

  const mustChangePassword = state.user?.mustChangePassword === true;
  const hasAcceptedTerms = !!state.user?.acceptedTermsAt;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        changePassword,
        acceptTerms,
        declineTerms,
        updateUser,
        mustChangePassword,
        hasAcceptedTerms,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
