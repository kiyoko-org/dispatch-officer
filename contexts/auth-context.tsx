import { DISPATCH_CONFIG } from '@/constants/config';
import { getDispatchClient, initDispatchClient, OfficerAuthProvider, useOfficerAuthContext } from 'dispatch-lib';
import { createContext, ReactNode, useContext } from 'react';

// Initialize the dispatch client
initDispatchClient(DISPATCH_CONFIG);

// Export the dispatch client for use throughout the app
export const getDispatchClientInstance = () => getDispatchClient();

// Auth context type that includes dispatch client access
export type AuthContextType = {
  dispatchClient: ReturnType<typeof getDispatchClientInstance>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export type AuthProviderProps = {
  children: ReactNode;
};

// Main auth provider that wraps the officer auth provider and provides dispatch client access
export function AuthProvider({ children }: AuthProviderProps) {
  const dispatchClient = getDispatchClientInstance();

  const value: AuthContextType = {
    dispatchClient,
  };

  return (
    <AuthContext.Provider value={value}>
      <OfficerAuthProvider>
        {children}
      </OfficerAuthProvider>
    </AuthContext.Provider>
  );
}

// Hook to access auth context
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

// Re-export the officer auth context for convenience
export { useOfficerAuthContext as useOfficerAuth };
