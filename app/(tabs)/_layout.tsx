import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { strings } = useLanguage();
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        // Configuration de base
        headerShown: false,
        // Désactiver les animations pour éviter les erreurs
        animationEnabled: false,
        // Style de la barre d'onglets
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopWidth: 0,
          // Z-index très bas pour que les modales passent au-dessus
          zIndex: Platform.OS === 'web' ? 10 : undefined,
          paddingBottom: Platform.select({
            android: 8,
            ios: 20,
            web: 16, // Padding augmenté pour web
            default: 8
          }),
          paddingTop: Platform.select({
            web: 8,
            default: 12
          }),
          height: Platform.select({
            android: 56,
            ios: 68,
            web: 80, // Hauteur augmentée pour web mobile
            default: 56
          }),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginTop: Platform.select({
            web: 4,
            default: 0
          }),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: strings.projects,
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="simple"
        options={{
          title: strings.quickCalc,
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="calculator-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: strings.search,
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: strings.notes,
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title: strings.export,
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="download-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,
          title: 'À propos',
        }}
      />
      <Tabs.Screen
        name="note"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Paramètres',
        }}
      />
      <Tabs.Screen
        name="project"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="building"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="zone"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="shutter"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="image-viewer"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}