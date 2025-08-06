import { useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    try {
      // Seulement pour le web, ignorer complètement sur mobile
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.frameworkReady) {
        window.frameworkReady();
      }
    } catch (error) {
      // Ignorer complètement les erreurs
    }
  }, []);
}