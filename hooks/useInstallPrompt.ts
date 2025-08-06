import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptState {
  showInstallButton: boolean;
  showIOSInstructions: boolean;
  isInstalled: boolean;
  isIOSDevice: boolean;
  isDesktop: boolean;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const [state, setState] = useState<InstallPromptState>({
    showInstallButton: false,
    showIOSInstructions: false,
    isInstalled: false,
    isIOSDevice: false,
    isDesktop: false
  });

  useEffect(() => {
    // Seulement pour le web
    if (Platform.OS !== 'web') {
      return;
    }

    // Détecter le type d'appareil et navigateur
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      console.log('🔍 User Agent détecté:', userAgent);
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroidDevice = /android/i.test(userAgent);
      const isDesktop = !(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent));
      
      console.log('📱 Détection appareil:', { isIOSDevice, isAndroidDevice, isDesktop });
      return { isIOSDevice, isAndroidDevice, isDesktop };
    };

    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      // Mode standalone (PWA installée)
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ PWA déjà installée - mode standalone');
        return true;
      }
      
      // iOS Safari mode standalone
      if (window.navigator && (window.navigator as any).standalone === true) {
        console.log('✅ PWA déjà installée - iOS standalone');
        return true;
      }
      
      return false;
    };

    const { isIOSDevice, isAndroidDevice, isDesktop } = detectDevice();
    const isInstalled = checkIfInstalled();

    console.log('🎯 État détecté:', { isIOSDevice, isAndroidDevice, isDesktop, isInstalled });

    setState(prev => ({
      ...prev,
      isIOSDevice,
      isDesktop,
      isInstalled
    }));

    // Si déjà installée, ne rien afficher
    if (isInstalled) {
      console.log('✅ PWA déjà installée, aucun prompt nécessaire');
      return;
    }

    // Sur PC/Desktop, ne rien afficher
    if (isDesktop) {
      console.log('💻 Appareil desktop détecté, aucun prompt d\'installation');
      return;
    }

    // Sur iOS, afficher les instructions manuelles après un délai
    if (isIOSDevice) {
      console.log('📱 Appareil iOS détecté, affichage des instructions manuelles');
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          showIOSInstructions: true
        }));
      }, 5000); // Attendre 5 secondes avant d'afficher les instructions

      return () => clearTimeout(timer);
    }

    // Sur Android, afficher les instructions manuelles après un délai
    if (isAndroidDevice) {
      console.log('🤖 Appareil Android détecté, affichage des instructions manuelles');
      const timer = setTimeout(() => {
        console.log('⏰ Timer Android déclenché, affichage des instructions');
        setShowAndroidInstructions(true);
      }, 3000); // Attendre 3 secondes avant d'afficher les instructions

      return () => clearTimeout(timer);
    }

    // Mode test : forcer l'affichage sur tous les appareils non-iOS
    const testMode = true; // Forcer pour la preview Bolt
    if (testMode && !isIOSDevice && !isInstalled) {
      console.log('🧪 Mode test activé pour appareil non-iOS');
      const timer = setTimeout(() => {
        console.log('⏰ Timer test déclenché, affichage des instructions Android');
        setShowAndroidInstructions(true);
      }, 1000); // Délai réduit pour la preview

      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstallClick = async () => {
    // Cette fonction n'est plus utilisée car on affiche des tutoriels au lieu de boutons
    console.log('📱 Fonction d\'installation appelée (non utilisée)');
  };

  const hideInstallButton = () => {
    setState(prev => ({
      ...prev,
      showInstallButton: false
    }));
    setDeferredPrompt(null);
  };

  const hideIOSInstructions = () => {
    setState(prev => ({
      ...prev,
      showIOSInstructions: false
    }));
  };

  const hideAndroidInstructions = () => {
    setShowAndroidInstructions(false);
  };

  return {
    showInstallButton: false, // Plus de bouton d'installation
    showAndroidInstructions: showAndroidInstructions && !state.isInstalled && Platform.OS === 'web',
    showIOSInstructions: state.showIOSInstructions && !state.isInstalled && Platform.OS === 'web',
    handleInstallClick,
    hideInstallButton,
    hideIOSInstructions,
    hideAndroidInstructions,
    isInstalled: state.isInstalled,
    isIOSDevice: state.isIOSDevice,
    isDesktop: state.isDesktop
  };
}