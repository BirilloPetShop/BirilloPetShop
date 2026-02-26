
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { STRAPI_API_URL } from '../constants';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('aquapet_user');
    const storedToken = localStorage.getItem('aquapet_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse user data", e);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const saveSession = (userData: User, jwt: string) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('aquapet_user', JSON.stringify(userData));
    localStorage.setItem('aquapet_token', jwt);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${STRAPI_API_URL}/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Login failed");
      }

      // Map Strapi User to our User Interface (adding custom fields if needed)
      const userData: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        nome_completo: data.user.nome_completo,
        indirizzo: data.user.indirizzo,
        note_indirizzo: data.user.note_indirizzo,
        citta: data.user.citta,
        cap: data.user.cap,
        telefono: data.user.telefono,
        created_at: data.user.createdAt
      };

      saveSession(userData, data.jwt);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(`${STRAPI_API_URL}/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        // If JSON parsing fails, try to get text
        const text = await response.text().catch(() => "No response body");
        throw new Error(`Server error (${response.status}): ${text}`);
      }

      if (!response.ok) {
        // Strapi v5/v4 error extraction
        const strapiError = data.error?.message || data.message || "Registration failed";
        throw new Error(strapiError);
      }

      if (!data.user) {
        // If response is OK but no user data, it might be a specific Strapi configuration
        // We can assume success if we got here without error, but we can't log them in automatically.
        return;
      }

      const userData: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        created_at: data.user.createdAt
      };

      // If Strapi is configured to require email confirmation, it might not return a JWT
      if (data.jwt) {
        saveSession(userData, data.jwt);
      }
      // If no JWT, we just return (success) and let the UI handle the "check email" message
    } catch (error) {
      console.error("Registration Error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aquapet_user');
    localStorage.removeItem('aquapet_token');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user || !token) return;

    try {
      // Note: Endpoint allows updating user/me in Strapi usually via PUT /users/me or /user/me depending on config
      const response = await fetch(`${STRAPI_API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || "Update failed");
      }

      // Update local state merging old data with new
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('aquapet_user', JSON.stringify(updatedUser));

    } catch (error) {
      console.error("Update Profile Error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${STRAPI_API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      const freshUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        nome_completo: data.nome_completo,
        indirizzo: data.indirizzo,
        note_indirizzo: data.note_indirizzo,
        citta: data.citta,
        cap: data.cap,
        telefono: data.telefono,
        created_at: data.createdAt
      };
      setUser(freshUser);
      localStorage.setItem('aquapet_user', JSON.stringify(freshUser));
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch(`${STRAPI_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        // Strapi often returns 200 even if email doesn't exist for security, 
        // but if it errors out, we catch it.
        const data = await response.json();
        throw new Error(data.error?.message || "Request failed");
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user && !!token,
      isLoading,
      token,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      forgotPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
