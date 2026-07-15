/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getAuthenticatedUser,
  login as apiLogin,
  logoutSession,
} from "../services/api";
import {
  clearStoredUser,
  getStoredToken,
  storeToken,
  storeUser,
} from "../lib/session";

const AuthContext = createContext();

function normalizeUser(response) {
  return {
    id: response.id,
    nome: response.nome,
    email: response.email,
    tipo: response.tipo,
    roles: Array.isArray(response.roles) && response.roles.length
      ? response.roles
      : [response.tipo].filter(Boolean),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getStoredToken()) {
        setLoading(false);
        return;
      }

      try {
        const response = await getAuthenticatedUser();
        if (!active) return;

        const userData = normalizeUser(response);
        storeUser(userData);
        setUser(userData);
        setIsAuthenticated(true);
      } catch {
        if (!active) return;
        clearStoredUser();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, senha) => {
    setLoading(true);

    try {
      const response = await apiLogin(email, senha);
      storeToken(response.token);
      const userData = normalizeUser(response);

      storeUser(userData);
      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (error) {
      const errorMessage = error.message || "Erro ao fazer login";

      clearStoredUser();
      setIsAuthenticated(false);
      setUser(null);

      throw new Error(errorMessage, { cause: error });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutSession();
    } finally {
      clearStoredUser();
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Voce foi desconectado");
    }
  };

  const updateUser = (updates) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...updates };
      storeUser(next);
      return next;
    });
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}
