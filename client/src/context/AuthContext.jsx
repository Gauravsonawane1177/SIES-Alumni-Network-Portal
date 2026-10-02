import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      if (data.data.user?.status === 'ACTIVE') connectSocket();
    } catch {
      setUser(null);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const onExpired = () => {
      setUser(null);
      disconnectSocket();
    };
    window.addEventListener('session-expired', onExpired);
    return () => window.removeEventListener('session-expired', onExpired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      async login(payload) {
        const { data } = await api.post('/auth/login', payload);
        setUser(data.data.user);
        connectSocket();
        return data;
      },
      async register(payload) {
        const { data } = await api.post('/auth/register', payload);
        if (data.data.user?.status === 'ACTIVE') {
          setUser(data.data.user);
          connectSocket();
        }
        return data;
      },
      async logout() {
        await api.post('/auth/logout');
        setUser(null);
        disconnectSocket();
      },
      refresh
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
