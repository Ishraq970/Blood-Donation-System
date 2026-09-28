import React, { createContext, useContext, useState, useEffect } from 'react';
import { type AuthUser, getMeApi, loginApi, logoutApi, registerApi, verifyEmailApi } from '../api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('roktolink_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const current = await getMeApi();
    setUser(current);
    setLoading(false);
  };

  useEffect(() => {
    const cached = localStorage.getItem('roktolink_user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        // ignore
      }
    }
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginApi(email, password);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const register = async (data: { name: string; email: string; phone?: string; password: string }) => {
    const res = await registerApi(data);
    return res;
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await verifyEmailApi(email, code);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const isVerified = Boolean(user && (user.is_verified || user.email_verified_at));
  const isAuthenticated = Boolean(user && isVerified);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isVerified, login, register, verifyEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
