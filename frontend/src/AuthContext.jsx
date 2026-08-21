import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize token from localStorage on initial load
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Manages initial auth check

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if the token is expired
        if (decoded.exp * 1000 < Date.now()) {
            throw new Error("Token expired");
        }
        // If token is valid, set the user
        setUser({ email: decoded.sub, role: decoded.role });
        localStorage.setItem('token', token); // Ensure it's stored
      } catch (error) {
        console.error("Authentication error:", error);
        // If token is invalid or expired, clear it
        setUser(null);
        localStorage.removeItem('token');
      }
    } else {
      // No token found
      setUser(null);
      localStorage.removeItem('token');
    }
    setLoading(false); // Finished checking for a token
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

