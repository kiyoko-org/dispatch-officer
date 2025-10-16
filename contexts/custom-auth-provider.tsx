import type { User } from "@supabase/supabase-js";
import { getDispatchClient } from "dispatch-lib";
import React, { createContext, useContext, useEffect, useState } from "react";

export type OfficerAuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isOfficer: boolean;
};

export type OfficerAuthContextType = OfficerAuthState & {
  signIn: (badgeNumber: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
};

const OfficerAuthContext = createContext<OfficerAuthContextType | null>(null);

export type OfficerAuthProviderProps = {
  children: React.ReactNode;
};

export function CustomOfficerAuthProvider({ children }: OfficerAuthProviderProps) {
  const [state, setState] = useState<OfficerAuthState>({
    user: null,
    isLoading: true,
    error: null,
    isOfficer: false,
  });

  const dispatchClient = getDispatchClient();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        // Check if user is authenticated
        const { data: { session }, error } = await dispatchClient.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          setState({ user: null, isLoading: false, error: error.message, isOfficer: false });
          return;
        }

        if (!session) {
          setState({ user: null, isLoading: false, error: null, isOfficer: false });
          return;
        }

        // Get user details
        const { data: { user }, error: userError } = await dispatchClient.auth.getUser();
        if (!mounted) return;
        
        if (userError) {
          setState({ user: null, isLoading: false, error: userError.message, isOfficer: false });
          return;
        }

        if (!user) {
          setState({ user: null, isLoading: false, error: null, isOfficer: false });
          return;
        }

        // Check if the user has officer role
        const isOfficer = user.user_metadata?.role === "officer";
        
        if (!isOfficer) {
          // Don't auto-sign out, just set error
          setState({ 
            user: null, 
            isLoading: false, 
            error: "Access denied: User is not an officer", 
            isOfficer: false 
          });
          return;
        }

        setState({ 
          user, 
          isLoading: false, 
          error: null, 
          isOfficer: true 
        });
      } catch (error) {
        if (!mounted) return;
        setState({ 
          user: null, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Unknown error', 
          isOfficer: false 
        });
      }
    };

    init();

    const { data: sub } = dispatchClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!session) {
          setState({ user: null, isLoading: false, error: null, isOfficer: false });
          return;
        }

        // For SIGNED_IN events, get fresh user data
        if (event === 'SIGNED_IN') {
          try {
            const { data: { user }, error: userError } = await dispatchClient.auth.getUser();
            if (!mounted) return;
            
            if (userError) {
              setState({ 
                user: null, 
                isLoading: false, 
                error: userError.message, 
                isOfficer: false 
              });
              return;
            }

            if (!user) {
              setState({ user: null, isLoading: false, error: null, isOfficer: false });
              return;
            }

            // Check if the user has officer role
            const isOfficer = user.user_metadata?.role === "officer";
            
            if (!isOfficer) {
              setState({ 
                user: null, 
                isLoading: false, 
                error: "Access denied: User is not an officer", 
                isOfficer: false 
              });
              return;
            }

            setState({ 
              user, 
              isLoading: false, 
              error: null, 
              isOfficer: true 
            });
          } catch (error) {
            if (!mounted) return;
            setState({ 
              user: null, 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Unknown error', 
              isOfficer: false 
            });
          }
        }
      },
    );

    return () => {
      mounted = false;
      if (
        sub &&
        sub.subscription &&
        typeof sub.subscription.unsubscribe === "function"
      ) {
        sub.subscription.unsubscribe();
      }
    };
  }, [dispatchClient]);

  const signIn = async (badgeNumber: string, password: string) => {
    try {
      // Use the officerLogin method from DispatchClient
      const result = await dispatchClient.officerLogin(badgeNumber, password);
      if (result.error) return { error: result.error };
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await dispatchClient.auth.signOut();
      if (error) return { error: error.message };
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  };

  const value: OfficerAuthContextType = {
    ...state,
    signIn,
    signOut,
  };

  return <OfficerAuthContext.Provider value={value}>{children}</OfficerAuthContext.Provider>;
}

function useOfficerAuthContext() {
  const ctx = useContext(OfficerAuthContext);
  if (!ctx) throw new Error("useOfficerAuthContext must be used within CustomOfficerAuthProvider");
  return ctx;
}

export { OfficerAuthContext, useOfficerAuthContext };
