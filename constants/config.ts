import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Dispatch client configuration using expo-constants
export const DISPATCH_CONFIG = {
  supabaseClientConfig: {
    url: Constants.expoConfig?.extra?.supabaseUrl || '',
    anonymousKey: Constants.expoConfig?.extra?.supabaseAnonKey || '',
    detectSessionInUrl: false,
    storage: AsyncStorage,
  },
};

// Validate that required configuration is set
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
  console.warn('Current config:', {
    supabaseUrl: supabaseUrl || 'MISSING',
    supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING'
  });
}
