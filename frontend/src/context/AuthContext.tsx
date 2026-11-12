import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRegisterRequest } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showSplash: boolean;
  dismissSplash: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: UserRegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  notification: { type: 'success' | 'info' | 'error'; message: string } | null;
  clearNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('glafit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('glafit_token') || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return sessionStorage.getItem('glafit_splash_dismissed') !== 'true';
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const clearNotification = () => setNotification(null);

  const dismissSplash = () => {
    setShowSplash(false);
    sessionStorage.setItem('glafit_splash_dismissed', 'true');
  };

  // Verify token on mount if user and token exist
  useEffect(() => {
    if (token) {
      api.getMe()
        .then((verifiedUser) => {
          setUser(verifiedUser);
          localStorage.setItem('glafit_user', JSON.stringify(verifiedUser));
        })
        .catch(() => {
          // Token expired or revoked
          setUser(null);
          setToken(null);
          localStorage.removeItem('glafit_user');
          localStorage.removeItem('glafit_token');
        });
    }
  }, []);

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ login_identifier: identifier, password: pass });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('glafit_user', JSON.stringify(res.user));
      localStorage.setItem('glafit_token', res.token);
      setShowAuthModal(false);
      setNotification({
        type: 'success',
        message: `Welcome back, ${res.user.name}! Authenticated securely.`
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: UserRegisterRequest) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('glafit_user', JSON.stringify(res.user));
      localStorage.setItem('glafit_token', res.token);
      setShowAuthModal(false);
      setNotification({
        type: 'success',
        message: `Registration successful! Welcome to Glafit, ${res.user.name}.`
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('glafit_user');
      localStorage.removeItem('glafit_token');
      sessionStorage.removeItem('glafit_active_inspection_session_v1');
      setIsLoading(false);
      setNotification({
        type: 'info',
        message: 'You have been logged out securely. Session ended.'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        showSplash,
        dismissSplash,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
        login,
        register,
        logout,
        notification,
        clearNotification
      }}
    >
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
