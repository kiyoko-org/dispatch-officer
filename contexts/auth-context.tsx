import { DISPATCH_CONFIG } from '@/constants/config';
import { getDispatchClient, initDispatchClient } from 'dispatch-lib';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { CustomOfficerAuthProvider, useOfficerAuthContext } from './custom-auth-provider';

// Initialize the dispatch client with proper error handling
let dispatchClient: ReturnType<typeof getDispatchClient> | null = null;

try {
  dispatchClient = initDispatchClient(DISPATCH_CONFIG);
} catch (error) {
  console.warn('Failed to initialize dispatch client:', error);
}

// Export the dispatch client for use throughout the app
export const getDispatchClientInstance = () => {
  if (!dispatchClient) {
    try {
      dispatchClient = getDispatchClient();
    } catch (error) {
      console.error('Dispatch client not initialized:', error);
      throw error;
    }
  }
  return dispatchClient;
};

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [client, setClient] = useState<ReturnType<typeof getDispatchClient> | null>(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        const dispatchClientInstance = getDispatchClientInstance();
        setClient(dispatchClientInstance);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to get dispatch client:', error);
        setIsInitialized(true); // Still set to true to prevent infinite loading
      }
    };

    initClient();
  }, []);

  if (!isInitialized) {
    // Show loading state while initializing
    return null;
  }

  if (!client) {
    // If client failed to initialize, show error or fallback
    console.error('Dispatch client failed to initialize');
    return <>{children}</>;
  }

  const value: AuthContextType = {
    dispatchClient: client,
  };

  return (
    <AuthContext.Provider value={value}>
      <CustomOfficerAuthProvider>
        {children}
      </CustomOfficerAuthProvider>
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

