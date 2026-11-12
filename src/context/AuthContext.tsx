
import {
  createContext,
  useCallback,
  useMemo,
  useState
} from "react";

import type { ReactNode } from "react";

import type {
  User,
  AuthContextType
} from "../types/auth.types";

import { loginUser } from "../services/authService";

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

const STORAGE_KEY = "support_auth";

// Restore user from sessionStorage during initialization.
const getStoredUser = (): User | null => {
  try {
    const storedUser = sessionStorage.getItem(STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser) as User;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({
  children
}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(
    getStoredUser
  );

  const [isLoading] = useState(false);

  // Login
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginUser(email, password);

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(response.user)
      );
      sessionStorage.setItem("token", response.token);

      setUser(response.user);
    },
    []
  );

  // Logout
  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout
    }),
    [user, isLoading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
