import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Default admin user - everyone has admin access
const DEFAULT_ADMIN_USER = { 
  role: 'admin',
  id: 'default-admin',
  name: 'Admin User'
};

export function AuthProvider({ children }) {
  const [isLoadingAuth] = useState(false);
  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);

  // Always use the default admin user - no state changes, no re-renders
  return (
    <AuthContext.Provider
      value={{
        user: DEFAULT_ADMIN_USER,
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
