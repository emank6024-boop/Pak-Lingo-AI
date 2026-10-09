/**
 * PakLingo AI - Administrative Authentication Context
 * Manages admin session state and server-side token verification.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminUser } from '../types';
import { AdminAPI, getStoredAdminToken, setStoredAdminToken } from '../api';

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const verifyCurrentSession = useCallback(async () => {
    const token = getStoredAdminToken();
    if (!token) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await AdminAPI.getMe();
      setAdmin(data.admin);
    } catch {
      // Token invalid or expired on backend
      setStoredAdminToken(null);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyCurrentSession();
  }, [verifyCurrentSession]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await AdminAPI.login(email, password);
      setAdmin(data.admin);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AdminAPI.logout();
    } catch {
      // ignore
    } finally {
      setAdmin(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await verifyCurrentSession();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
