// frontend\contexts\AuthContext.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthData } from '@/lib/types';
import { loginUserAction, logoutUserAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children, serverUser }: { children: ReactNode; serverUser: User | null }) => {
  const [user, setUser] = useState<User | null>(serverUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    setUser(serverUser);
    setIsLoading(false);
  }, [serverUser]);


  const login = async (authData: AuthData) => {
    await loginUserAction(authData);
    setUser(authData.user);
    if (authData.user.role === UserRole.Admin) {
      router.push('/admin/dashboard');
    } else if (authData.user.role === UserRole.Operator) {
      router.push('/operator/tasks');
    } else {
      console.warn("Unknown user role, redirecting to home", authData.user.role);
      router.push('/');
    }
  };

  const logout = async () => {
    await logoutUserAction();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};