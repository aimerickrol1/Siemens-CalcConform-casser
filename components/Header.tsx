import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Info } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  showSettings?: boolean;
}

export function Header({ title, subtitle, onBack, rightComponent, showSettings = true }: HeaderProps) {
  const { strings } = useLanguage();
  const { theme } = useTheme();

  const handleSettingsPress = () => {
    try {
      router.push('/(tabs)/settings');
    } catch (error) {
      console.error('Erreur de navigation vers paramètres:', error);
    }
  };

  const handleAboutPress = () => {
    try {
      router.push('/(tabs)/about');
    } catch (error) {
      console.error('Erreur de navigation vers à propos:', error);
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, Platform.OS === 'web' && styles.containerWeb]}>
      {/* Barre supérieure avec logo plus grand et bouton paramètres TOUJOURS visible */}
      <View style={[styles.topBar, Platform.OS === 'web' && styles.topBarWeb]}>
        <View style={styles.topBarContent}>
          {/* Logo Siemens plus grand et centré */}
          <View style={styles.logoSection}>
            <Image 
              source={require('../assets/images/Siemens-Logo.png')}
              style={[styles.logo, Platform.OS === 'web' && styles.logoWeb]}
              resizeMode="contain"
            />
          </View>
          
          {/* Icône paramètres TOUJOURS affichée (sauf si explicitement désactivée) */}
          {showSettings && (
            <View style={styles.topBarActions}>
              <TouchableOpacity 
                style={styles.topBarButton}
                onPress={handleAboutPress}
              >
                <Info size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.topBarButton}
                onPress={handleSettingsPress}
              >
                <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {/* Header principal avec navigation */}
      <View style={[styles.mainHeader, Platform.OS === 'web' && styles.mainHeaderWeb]}>
        <View style={styles.left}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        {rightComponent && (
          <View style={styles.right}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: 44,
  },
  containerWeb: {
    paddingTop: Platform.select({
      web: 20, // Réduire le padding top sur web
      default: 44
    }),
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  topBarWeb: {
    paddingVertical: 4, // Réduire le padding vertical sur web
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 40,
  },
  logoSection: {
    alignItems: 'center',
  },
  logo: {
    height: 36,
    width: 119,
  },
  logoWeb: {
    height: 24, // Logo plus petit sur web
    width: 79,
  },
  settingsButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -11 }],
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  topBarActions: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -11 }],
    flexDirection: 'row',
    gap: 8,
  },
  topBarButton: {
    padding: 6,
    borderRadius: 6,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mainHeaderWeb: {
    paddingVertical: 8, // Réduire le padding vertical sur web
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  right: {
    marginLeft: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});