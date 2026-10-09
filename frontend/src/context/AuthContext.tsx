import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, removeToken, getToken } from '../api/client';
import { getTelegramInitData, getTelegramUser, initTelegramApp, hapticNotification } from '../utils/telegram';
import { initSocket, disconnectSocket } from '../api/socket';

export interface User {
  id: string;
  telegram_id?: number | null;
  email?: string | null;
  avatar_url?: string | null;
  role: 'SUPPLIER' | 'RECEIVER';
  first_name: string;
  last_name: string;
  phone_primary: string;
  phone_secondary?: string | null;
  language: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  company_name: string;
  delivery_fee: number;
  is_free_delivery: boolean;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  supplier: Supplier | null;
  token: string | null;
  isLoading: boolean;
  isNewUser: boolean;
  telegramUser: any;
  loginWithDevRole: (role: 'SUPPLIER' | 'RECEIVER') => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  registerWithEmail: (data: any) => Promise<void>;
  loginWithEmail: (data: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (data: any) => Promise<{ isNewUser?: boolean; googleUser?: any }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [telegramUser, setTelegramUser] = useState<any>(null);

  // Initialize Telegram WebApp and check session
  useEffect(() => {
    initTelegramApp();

    const initAuth = async () => {
      setIsLoading(true);
      try {
        const initData = getTelegramInitData();
        const tgUser = getTelegramUser();

        if (tgUser) {
          setTelegramUser(tgUser);
        }

        // If inside Telegram with initData, attempt Telegram validation
        if (initData) {
          try {
            const res = await api.auth.validateTelegram(initData);
            if (res.isNewUser) {
              setIsNewUser(true);
              setTelegramUser(res.telegramUser || tgUser);
            } else {
              setToken(res.token);
              setTokenState(res.token);
              setUser(res.user);
              setSupplier(res.supplier || null);
              initSocket(res.user.id, res.user.role);
            }
            setIsLoading(false);
            return;
          } catch (err) {
            console.warn('Telegram initData validation failed, checking saved token...', err);
          }
        }

        // If we have saved JWT token, check session
        const existingToken = getToken();
        if (existingToken) {
          try {
            const meRes = await api.auth.getMe();
            setUser(meRes.user);
            setSupplier(meRes.supplier || null);
            initSocket(meRes.user.id, meRes.user.role);
          } catch (e) {
            removeToken();
            setTokenState(null);
            setUser(null);
            setSupplier(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginWithEmail = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.loginEmail(data);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setSupplier(res.supplier || null);
      setIsNewUser(false);
      initSocket(res.user.id, res.user.role);
      hapticNotification('success');
    } catch (err: any) {
      hapticNotification('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.registerEmail(data);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setSupplier(res.supplier || null);
      setIsNewUser(false);
      initSocket(res.user.id, res.user.role);
      hapticNotification('success');
    } catch (err: any) {
      hapticNotification('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleData: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.googleAuth(googleData);
      if (res.isNewUser) {
        setIsLoading(false);
        return { isNewUser: true, googleUser: res.googleUser };
      }
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setSupplier(res.supplier || null);
      setIsNewUser(false);
      initSocket(res.user.id, res.user.role);
      hapticNotification('success');
      return { isNewUser: false };
    } catch (err: any) {
      hapticNotification('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDevRole = async (role: 'SUPPLIER' | 'RECEIVER') => {
    setIsLoading(true);
    try {
      const res = await api.auth.devLogin(role);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setSupplier(res.supplier || null);
      initSocket(res.user.id, res.user.role);
      hapticNotification('success');
    } catch (err: any) {
      hapticNotification('error');
      alert(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setSupplier(res.supplier || null);
      setIsNewUser(false);
      initSocket(res.user.id, res.user.role);
      hapticNotification('success');
    } catch (err: any) {
      hapticNotification('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
    setSupplier(null);
    disconnectSocket();
    hapticNotification('warning');
  };

  const refreshProfile = async () => {
    try {
      const meRes = await api.auth.getMe();
      setUser(meRes.user);
      setSupplier(meRes.supplier || null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supplier,
        token,
        isLoading,
        isNewUser,
        telegramUser,
        loginWithDevRole,
        registerUser,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        refreshProfile,
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
