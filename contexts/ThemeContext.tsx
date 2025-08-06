import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Arrière-plans
  background: string;
  surface: string;
  surfaceSecondary: string;
  
  // Textes
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Bordures et séparateurs
  border: string;
  separator: string;
  
  // Couleurs Siemens
  primary: string;
  primaryDark: string;
  
  // États
  success: string;
  warning: string;
  error: string;
  
  // Inputs et cartes
  inputBackground: string;
  cardBackground: string;
  
  // Navigation
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceSecondary: '#F3F4F6',
    
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    border: '#E5E7EB',
    separator: '#F3F4F6',
    
    primary: '#009999',
    primaryDark: '#007A7A',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    inputBackground: '#FFFFFF',
    cardBackground: '#FFFFFF',
    
    tabBarBackground: '#009999',
    tabBarActive: '#FFFFFF',
    tabBarInactive: 'rgba(255, 255, 255, 0.6)',
  }
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0B1220',
    surface: '#111927',
    surfaceSecondary: '#1C263B',
    
    text: '#F0F4F8',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    
    border: '#1C263B',
    separator: '#1E293B',
    
    primary: '#006D6D',
    primaryDark: '#005555',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    inputBackground: '#1C263B',
    cardBackground: '#111927',
    
    tabBarBackground: '#006D6D',
    tabBarActive: '#F0F4F8',
    tabBarInactive: 'rgba(240, 244, 248, 0.6)',
  }
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Clé pour le stockage du thème
const THEME_STORAGE_KEY = 'themePreference';

// Fonction utilitaire pour sauvegarder le thème
const saveThemeToStorage = async (mode: ThemeMode) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } else {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde du thème:', error);
  }
};

// Fonction utilitaire pour charger le thème
const loadThemeFromStorage = async (): Promise<ThemeMode> => {
  try {
    let savedTheme: string | null = null;
    
    if (Platform.OS === 'web') {
      savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    } else {
      savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    }
    
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      console.log('✅ Thème chargé depuis le stockage:', savedTheme);
      return savedTheme as ThemeMode;
    }
  } catch (error) {
    console.warn('Erreur lors du chargement du thème:', error);
  }
  
  // Valeur par défaut si aucun thème sauvegardé
  console.log('📱 Aucun thème sauvegardé, utilisation du mode automatique');
  return 'auto';
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Charger le thème au démarrage
  React.useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedTheme = await loadThemeFromStorage();
        setThemeModeState(savedTheme);
        console.log('🎨 Thème initialisé:', savedTheme);
      } catch (error) {
        console.warn('Erreur lors de l\'initialisation du thème:', error);
        setThemeModeState('auto');
      } finally {
        setIsThemeLoaded(true);
      }
    };

    initializeTheme();
  }, []);

  // Déterminer le thème actuel basé sur le mode sélectionné
  const getCurrentTheme = (): Theme => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getCurrentTheme();
  const isDark = theme.mode === 'dark';

  // Fonction pour changer le thème avec sauvegarde
  const setThemeMode = async (mode: ThemeMode) => {
    console.log('🎨 Changement de thème vers:', mode);
    setThemeModeState(mode);
    await saveThemeToStorage(mode);
  };

  // Ne pas rendre les enfants tant que le thème n'est pas chargé
  if (!isThemeLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode: setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}