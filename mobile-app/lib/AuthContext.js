import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('hn_user').then(u => {
      if (u) try { setUser(JSON.parse(u)); } catch {}
      setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    await AsyncStorage.setItem('hn_token', data.token);
    await AsyncStorage.setItem('hn_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    await AsyncStorage.setItem('hn_token', data.token);
    await AsyncStorage.setItem('hn_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['hn_token', 'hn_user']);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
