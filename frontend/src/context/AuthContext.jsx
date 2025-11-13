import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to restore user from localStorage
    try {
      const storedUser = localStorage.getItem("cmscrm-user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    // Try localStorage first, then cookies as fallback
    const localToken = localStorage.getItem("cmscrm-token");
    const cookieToken = Cookies.get("cmscrm-token");
    const storedToken = localToken || cookieToken;
    // Only return token if it exists and looks valid (not empty)
    return storedToken && storedToken.length > 10 ? storedToken : null;
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutTimeoutRef = useRef(null);

  const handleAuthError = useCallback(() => {
    if (!isLoggingOut) {
      setIsLoggingOut(true);
      localStorage.removeItem("cmscrm-token");
      Cookies.remove("cmscrm-token");
      setToken(null);
      setUser(null);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const verifyToken = useCallback(async () => {
    if (isLoggingOut) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get("/auth/verify");
      // Handle both response.data.user and response.data.data.user structures
      const userData = response.data.data?.user || response.data.user;
      setUser(userData);
      setIsLoggingOut(false); // Reset logout flag on successful verification
    } catch (error) {
      // Silently clear auth state without showing error messages
      console.error("Token verification failed:", error);
      localStorage.removeItem("cmscrm-token");
      Cookies.remove("cmscrm-token");
      setToken(null);
      setUser(null);
      setIsLoggingOut(false);
    } finally {
      setLoading(false);
    }
  }, [isLoggingOut]);

  const logout = useCallback(
    async (showToast = true) => {
      if (isLoggingOut) {
        return; // Prevent multiple logout calls
      }

      setIsLoggingOut(true);

      try {
        // Only call logout API if we have a valid token
        if (token) {
          await axios.post("/auth/logout");
        }
      } catch (error) {
        // Ignore logout API errors - we're clearing local state anyway
        console.error("Logout API error:", error);
      }

      // Clear local state
      localStorage.removeItem("cmscrm-token");
      localStorage.removeItem("cmscrm-user");
      Cookies.remove("cmscrm-token");
      setToken(null);
      setUser(null);
      setIsLoggingOut(false);

      // Clear any pending logout timeouts
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
      }

      // Only show toast if requested (to prevent multiple toasts)
      if (showToast) {
        toast.success("Logged out successfully", {
          style: {
            background: "#1f2937", // dark gray background
            color: "#e5e7eb", // light text
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "10px 14px",
          },
          iconTheme: {
            primary: "#22c55e", // green success icon
            secondary: "#1f2937",
          },
        });
      }
    },
    [isLoggingOut, token]
  );

  const login = async (email, password) => {
    try {
      const response = await axios.post("/auth/login", { email, password });
      const { token: authToken, user: userData } = response.data.data;

      // Store in both localStorage and cookies for redundancy
      localStorage.setItem("cmscrm-token", authToken);
      Cookies.set("cmscrm-token", authToken, {
        expires: 2,
        secure: window.location.protocol === "https:",
        sameSite: "strict",
      });

      // Also store user data for faster loading
      localStorage.setItem("cmscrm-user", JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      setIsLoggingOut(false); // Reset logout flag on successful login

      // toast.success(`Welcome back, ${userData.username}!`);
      toast.success(`Welcome back, ${userData?.username || "User"}!`, {
        style: {
          background: "#1f2937", // dark gray background
          color: "#e5e7eb", // light text
          border: "1px solid #374151",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#22c55e", // green success icon
          secondary: "#1f2937",
        },
      });

      // Return user data and ensure state is set
      return { success: true, user: userData, token: authToken };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      // toast.error(message);
      toast.error(message || "Something went wrong", {
        style: {
          background: "#1f2937", // dark gray background
          color: "#fca5a5", // soft red text for error
          border: "1px solid #4b5563",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#ef4444", // red error icon
          secondary: "#1f2937", // matches dark bg
        },
      });

      return { success: false, message };
    }
  };

  useEffect(() => {
    // Note: Request interceptor is now handled in api.js to avoid conflicts
    // Set up response interceptor for auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle 401 errors for authentication
        if (error.response?.status === 401 && !isLoggingOut) {
          // Only handle auth errors from our API
          if (
            error.config?.baseURL?.includes("localhost:5000") ||
            error.config?.url?.includes("/api/")
          ) {
            console.log("401 error detected, logging out...");
            handleAuthError();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [isLoggingOut, handleAuthError]);

  useEffect(() => {
    // Set up response interceptor for handling auth errors
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Only handle 401s for non-logout endpoints and if we have a token
        if (
          error.response?.status === 401 &&
          token &&
          !isLoggingOut &&
          !error.config?.url?.includes("/auth/logout") &&
          !error.config?.url?.includes("/auth/verify")
        ) {
          // Clear timeout if exists
          if (logoutTimeoutRef.current) {
            clearTimeout(logoutTimeoutRef.current);
          }

          // Debounce logout to prevent multiple calls
          logoutTimeoutRef.current = setTimeout(() => {
            if (!isLoggingOut) {
              console.log("Session expired, logging out...");
              logout();
            }
          }, 100);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, [token, isLoggingOut, logout]);

  useEffect(() => {
    // Debounce verification to avoid too many requests
    const verifyTimer = setTimeout(() => {
      if (token && !isLoggingOut && user === null) {
        // Only verify token if we have a token but no user data
        // This handles page refresh scenarios where we need to restore auth state
        verifyToken();
      } else if (!token) {
        // No token, ensure loading is false and user is cleared
        setLoading(false);
        setUser(null);
      } else if (token && user) {
        // Token and user already exist, no need to verify
        setLoading(false);
      }
    }, 200); // Increased debounce to 200ms

    return () => clearTimeout(verifyTimer);
  }, [token, user, isLoggingOut, verifyToken]);

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put("/auth/profile", profileData);
      setUser(response.data.user);
      toast.success("Profile updated successfully", {
        style: {
          background: "#1f2937", // dark gray background
          color: "#e5e7eb", // light text
          border: "1px solid #374151",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#22c55e", // green success icon
          secondary: "#1f2937",
        },
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Profile update failed";
      toast.error(message || "Something went wrong", {
        style: {
          background: "#1f2937", // dark gray background
          color: "#fca5a5", // soft red text for error
          border: "1px solid #4b5563",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#ef4444", // red error icon
          secondary: "#1f2937", // matches dark bg
        },
      });

      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully", {
        style: {
          background: "#1f2937", // dark gray background
          color: "#e5e7eb", // light text
          border: "1px solid #374151",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#22c55e", // green success icon
          secondary: "#1f2937",
        },
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Password change failed";
      toast.error(message || "Something went wrong", {
        style: {
          background: "#1f2937", // dark gray background
          color: "#fca5a5", // soft red text for error
          border: "1px solid #4b5563",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        iconTheme: {
          primary: "#ef4444", // red error icon
          secondary: "#1f2937", // matches dark bg
        },
      });

      return { success: false, message };
    }
  };

  const hasRole = (roleName) => {
    if (!user?.roles) return false;

    // Handle both string roles and object roles
    return user.roles.some((role) => {
      const roleValue = typeof role === "string" ? role : role.name;

      // Map backend role names to display names
      const roleMapping = {
        super_admin: "Super Admin",
        admin: "Admin",
        manager: "Manager",
        user: "User",
      };

      // Check both original role and mapped role
      return roleValue === roleName || roleMapping[roleValue] === roleName;
    });
  };

  const hasPermission = (pageUrl) => {
    return user?.accessiblePages?.some((page) => page.url === pageUrl) || false;
  };

  const isAdmin = () => {
    return hasRole("Super Admin") || hasRole("Admin");
  };

  const isManager = () => hasRole("Manager");
  const isUser = () => hasRole("User");

  const forceLogout = () => {
    console.log("Force logout initiated...");
    setIsLoggingOut(false);
    setLoading(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem("cmscrm-token");
    Cookies.remove("cmscrm-token");

    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    forceLogout,
    updateProfile,
    changePassword,
    hasRole,
    hasPermission,
    isAdmin,
    isManager,
    isUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
