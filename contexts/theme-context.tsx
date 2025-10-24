import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';
type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  setThemeMode: (mode: ThemeMode) => void;
  isAmoledMode: boolean;
  setIsAmoledMode: (enabled: boolean) => void;
  colors: typeof lightColors;
}

const lightColors = {
  primary: '#2196F3',
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  accent: '#FF5722',
  shadow: '#000000',
  statusBar: '#FFFFFF',
  navBarText: '#000000',
};

const darkColors = {
  primary: '#64B5F6',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#42A5F5',
  accent: '#FF7043',
  shadow: '#000000',
  statusBar: '#1E1E1E',
  navBarText: '#FFFFFF',
};

const amoledColors = {
  primary: '#64B5F6',
  background: '#000000',
  card: '#0A0A0A',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#1A1A1A',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#42A5F5',
  accent: '#FF7043',
  shadow: '#000000',
  statusBar: '#000000',
  navBarText: '#FFFFFF',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';
const AMOLED_STORAGE_KEY = '@app_amoled_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isAmoledMode, setIsAmoledModeState] = useState<boolean>(false);
  
  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeModeState(savedTheme as ThemeMode);
      }
      
      const savedAmoled = await AsyncStorage.getItem(AMOLED_STORAGE_KEY);
      if (savedAmoled !== null) {
        setIsAmoledModeState(savedAmoled === 'true');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const setIsAmoledMode = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(AMOLED_STORAGE_KEY, enabled.toString());
      setIsAmoledModeState(enabled);
    } catch (error) {
      console.error('Failed to save AMOLED preference:', error);
    }
  };

  // Determine active theme based on mode
  const activeTheme: ActiveTheme = 
    themeMode === 'system' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : themeMode;

  const colors = activeTheme === 'dark' 
    ? (isAmoledMode ? amoledColors : darkColors) 
    : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, activeTheme, setThemeMode, isAmoledMode, setIsAmoledMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
