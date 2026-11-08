'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchApi } from '@/lib/api';

export interface User {
  id: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'ALUMNI_MENTOR' | 'ALUMNI_RELATIONS_OFFICER' | 'PLACEMENT_OFFICER' | 'SUPER_ADMIN';
  status: string;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getDashboardRouteForRole: (role: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getDashboardRouteForRole(role: string): string {
  switch (role) {
    case 'STUDENT':
      return '/student';
    case 'ALUMNI_MENTOR':
      return '/mentor';
    case 'ALUMNI_RELATIONS_OFFICER':
      return '/officer';
    case 'PLACEMENT_OFFICER':
      return '/officer';
    case 'SUPER_ADMIN':
      return '/officer';
    default:
      return '/';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetchApi<User>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetchApi<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', res.data.token);
        }
        setUser(res.data.user);
        setIsLoading(false);
        return { success: true, user: res.data.user };
      } else {
        setIsLoading(false);
        return { success: false, error: res.error?.message || 'Invalid credentials' };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
      setIsLoading(false);
      router.push('/auth/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        getDashboardRouteForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

