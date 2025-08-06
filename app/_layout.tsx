import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StorageProvider } from '@/contexts/StorageContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Prévenir l'auto-hide du splash screen de manière sécurisée
try {
  if (Platform.OS !== 'web') {
    SplashScreen.preventAutoHideAsync();
  }
} catch (error) {
  console.warn('SplashScreen error:', error);
}

// Composant de chargement simple
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>SIEMENS</Text>
        <Text style={styles.appName}>CalcConform</Text>
      </View>
      <Text style={styles.loadingText}>Initialisation...</Text>
    </View>
  );
}

// Composant d'erreur simple
function ErrorScreen({ error }: { error: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Erreur de démarrage</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Text style={styles.errorSubtext}>Veuillez redémarrer l'application</Text>
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { 
    showInstallButton, 
    showIOSInstructions, 
    handleInstallClick, 
    hideInstallButton, 
    hideIOSInstructions,
    isIOSDevice,
    showAndroidInstructions,
    hideAndroidInstructions
  } = useInstallPrompt();

  // Configuration spécifique pour le web mobile
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Enregistrer le Service Worker pour PWA
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('✅ Service Worker enregistré:', registration.scope);
              
              // Gestion des mises à jour
              registration.addEventListener('updatefound', () => {
                console.log('🔄 Nouvelle version du Service Worker trouvée');
                const newWorker = registration.installing;
                
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('✨ Nouvelle version disponible');
                    }
                  });
                }
              });
            })
            .catch((error) => {
              console.error('❌ Erreur enregistrement Service Worker:', error);
            });
        });
      }
      
      // Empêcher le zoom sur les inputs sur iOS Safari
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
      
      // Charger les styles CSS pour PWA
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/web-app-styles.css';
      document.head.appendChild(link);
      
      // Ajouter le manifest pour PWA
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
      
      // Ajouter les meta tags pour iOS
      const appleMobileWebAppCapable = document.createElement('meta');
      appleMobileWebAppCapable.name = 'apple-mobile-web-app-capable';
      appleMobileWebAppCapable.content = 'yes';
      document.head.appendChild(appleMobileWebAppCapable);
      
      const appleMobileWebAppStatusBarStyle = document.createElement('meta');
      appleMobileWebAppStatusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
      appleMobileWebAppStatusBarStyle.content = 'default';
      document.head.appendChild(appleMobileWebAppStatusBarStyle);
      
      const appleMobileWebAppTitle = document.createElement('meta');
      appleMobileWebAppTitle.name = 'apple-mobile-web-app-title';
      appleMobileWebAppTitle.content = 'Siemens CalcConform';
      document.head.appendChild(appleMobileWebAppTitle);
      
      // Ajouter l'icône pour iOS
      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = './assets/images/icon1.png';
      document.head.appendChild(appleIcon);
    }
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initialisation de l\'application...');
        
        // Attendre que les polices soient chargées
        if (fontsLoaded || fontError) {
          console.log('✅ Polices chargées');
          
          // Cacher le splash screen seulement sur mobile
          if (Platform.OS !== 'web') {
            try {
              await SplashScreen.hideAsync();
              console.log('✅ Splash screen caché');
            } catch (error) {
              console.warn('⚠️ Erreur splash screen:', error);
            }
          }
          
          // Délai pour s'assurer que tout est prêt
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('✅ Application prête');
          setIsReady(true);
        }
      } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        setError('Erreur de démarrage');
        setIsReady(true); // Continuer malgré l'erreur
      }
    };

    initializeApp();
  }, [fontsLoaded, fontError]);

  // Écran de chargement
  if (!isReady) {
    return <LoadingScreen />;
  }

  // Écran d'erreur
  if (error) {
    return <ErrorScreen error={error} />;
  }

  // Application principale avec providers
  return (
    <ThemeProvider>
      <LanguageProvider>
        <StorageProvider>
          <ModalProvider>
            <Slot />
            <StatusBar style="auto" />
            <InstallPrompt 
              visible={false}
              onInstall={handleInstallClick}
              onClose={hideInstallButton} 
              showAndroidInstructions={showAndroidInstructions}
              onCloseAndroidInstructions={hideAndroidInstructions}
              showIOSInstructions={showIOSInstructions}
              onCloseIOSInstructions={hideIOSInstructions}
              isIOSDevice={isIOSDevice}
            />
          </ModalProvider>
        </StorageProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#009999',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    marginBottom: 8,
  },
  appName: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});