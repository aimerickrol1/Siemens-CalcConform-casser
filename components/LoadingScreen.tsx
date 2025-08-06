import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '@/components/Header';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingScreenProps {
  title?: string;
  message?: string;
}

export function LoadingScreen({ 
  title = "Chargement...", 
  message = "Chargement des données..." 
}: LoadingScreenProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Header title={title} />
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
});