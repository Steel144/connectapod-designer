import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Default admin user - everyone has admin access
const DEFAULT_ADMIN_USER = { 
  role: 'admin',
  id: 'default-admin',
  name: 'Admin User'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEFAULT_ADMIN_USER);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Ensure user is always set to admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setUser(DEFAULT_ADMIN_USER);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user: DEFAULT_ADMIN_USER, // Always return admin user
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        navigateToLogin: () => {},
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
