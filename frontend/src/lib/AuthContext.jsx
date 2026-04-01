import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Admin password (set your own password here)
const ADMIN_PASSWORD = 'admin123'; // Change this to your preferred password

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth] = useState(false);
  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);

  // Check localStorage for admin session on mount
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
      setUser({ 
        role: 'admin',
        id: 'admin',
        name: 'Admin User'
      });
    } else {
      setUser({
        role: 'public',
        id: 'public-user',
        name: 'Guest'
      });
    }
  }, []);

  const login = (password) => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('isAdmin', 'true');
      setUser({ 
        role: 'admin',
        id: 'admin',
        name: 'Admin User'
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('isAdmin');
    setUser({
      role: 'public',
      id: 'public-user',
      name: 'Guest'
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        navigateToLogin: () => {},
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
