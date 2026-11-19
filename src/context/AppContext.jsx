import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService.js';
import { initDB, subscribe, resetDB } from '../services/storageService.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  initDB();
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [version, setVersion] = useState(0);

  useEffect(
    () =>
      subscribe(() => {
        setVersion((v) => v + 1);
        setUser(authService.getCurrentUser());
      }),
    [],
  );

  const login = useCallback((email, password) => {
    const res = authService.login(email, password);
    if (res.ok) setUser(authService.getCurrentUser());
    return res;
  }, []);

  const register = useCallback((data) => {
    const res = authService.register(data);
    if (res.ok) setUser(authService.getCurrentUser());
    return res;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const resetDemo = useCallback(() => {
    resetDB();
    setUser(null);
  }, []);

  return <AppContext.Provider value={{ user, version, login, register, logout, resetDemo }}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
