import { useOfficerAuth } from '@/contexts/auth-context';
import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

type AuthGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading, error, isOfficer } = useOfficerAuth();
  const router = useRouter();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
            Checking authentication...
          </Text>
        </View>
      )
    );
  }

  // Only redirect to login if there's a clear authentication error
  // Don't redirect if error is just "session missing" - that's normal on first load
  if (error && !error.includes('session missing') && !error.includes('No session found')) {
    console.warn('Auth error:', error);
    return <Redirect href="/login" />;
  }

  // If user is not authenticated or not an officer, redirect to login
  if (!user || !isOfficer) {
    return <Redirect href="/login" />;
  }

  // User is authenticated and is an officer, render children
  return <>{children}</>;
}

// Hook to check if user should be redirected to login
export function useAuthRedirect() {
  const { user, isLoading, error, isOfficer } = useOfficerAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && (error || !user || !isOfficer)) {
      router.replace('/login');
    }
  }, [user, isLoading, error, isOfficer, router]);

  return { user, isLoading, error, isOfficer };
}
