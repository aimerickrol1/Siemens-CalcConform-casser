import React from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';

export function StatusBar() {
  const { theme } = useTheme();
  
  return <ExpoStatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />;
}