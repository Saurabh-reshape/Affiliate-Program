import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiService } from "../services/api";

// Keys for localStorage
const STORAGE_KEYS = {
  USER_NAME: "affiliateUserName",
  USER_EMAIL: "affiliateUserEmail",
};

interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get stored user from localStorage
function getStoredUser(): AuthUser | null {
  const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);

  if (name && email) {
    return { name, email };
  }
  return null;
}

// Helper to save user to localStorage
function saveUserToStorage(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name);
  localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
}

// Helper to clear user from localStorage
function clearUserFromStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_NAME);
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  // Also clear legacy authToken if present
  localStorage.removeItem("authToken");
  // Clear legacy role if present
  localStorage.removeItem("affiliateUserRole");
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status by calling get-affiliate-user API
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAffiliateUser();

      if (response.success && response.name && response.email) {
        const authUser: AuthUser = {
          name: response.name,
          email: response.email,
        };
        setUser(authUser);
        saveUserToStorage(authUser);
      } else {
        // Invalid/expired session
        setUser(null);
        clearUserFromStorage();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      clearUserFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await apiService.affiliateLogin(email, password);

        // If backend returns user details directly, use them
        if (response.success && response.name && response.email) {
          const authUser: AuthUser = {
            name: response.name,
            email: response.email,
          };
          setUser(authUser);
          saveUserToStorage(authUser);
          return { success: true };
        }

        // In production, backend may only set cookie without user fields
        // Fetch current user to complete login state and validate cookie was set
        if (response.success) {
          try {
            // Add retry logic for production environments
            // let lastError: any;
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                const me = await apiService.getAffiliateUser();

                if (me.success && me.name && me.email) {
                  const authUser: AuthUser = { name: me.name, email: me.email };
                  setUser(authUser);
                  saveUserToStorage(authUser);
                  return { success: true };
                } else {
                }
              } catch (e: any) {
                // lastError = e;

                if (attempt < 2) {
                  // Wait before retrying
                  await new Promise((resolve) =>
                    setTimeout(resolve, 300 * (attempt + 1))
                  );
                }
              }
            }

            // If we got here, the login response had success but couldn't get user details
            // This might indicate a cookie/session issue in production
          } catch (e) {}
        } else {
        }

        return {
          success: false,
          message: response.message || "Login failed",
        };
      } catch (error: any) {
        // console.error("[AuthContext.login] Login error:", error);
        return {
          success: false,
          message: error.message || "An error occurred during login",
        };
      }
    },
    []
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiService.affiliateLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state regardless of API result
      setUser(null);
      clearUserFromStorage();
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
