import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * Custom hook to handle Android back button presses
 * Optimisé pour APK Android avec gestion d'erreur robuste
 */
export function useAndroidBackButton(customAction?: () => boolean) {
  useEffect(() => {
    // Seulement sur Android pour éviter les erreurs sur autres plateformes
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      try {
        // Si il y a une action personnalisée, l'exécuter en premier
        if (customAction && customAction()) {
          return true;
        }

        // Vérifier si on peut revenir en arrière dans la pile de navigation
        if (router.canGoBack()) {
          router.back();
          return true;
        }

        // Si on est sur l'écran d'accueil, laisser le comportement par défaut
        return false;
      } catch (error) {
        if (__DEV__) {
          console.warn('Erreur dans useAndroidBackButton:', error);
        }
        return false;
      }
    };

    // Ajouter l'écouteur d'événement avec gestion d'erreur
    let backHandler: any = null;
    try {
      backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
    } catch (error) {
      if (__DEV__) {
        console.warn('Erreur lors de l\'ajout du BackHandler:', error);
      }
      return;
    }

    // Nettoyer l'écouteur au démontage
    return () => {
      try {
        if (backHandler && backHandler.remove) {
          backHandler.remove();
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Erreur lors du nettoyage BackHandler:', error);
        }
      }
    };
  }, [customAction]);
}

/**
 * Custom hook pour gérer le double appui pour quitter
 * Optimisé pour APK Android avec gestion d'erreur robuste
 */
export function useDoubleBackToExit() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let backPressCount = 0;
    let backPressTimer: NodeJS.Timeout | null = null;

    const handleBackPress = () => {
      try {
        // Si c'est le premier appui ou que le timer a expiré
        if (backPressCount === 0 || !backPressTimer) {
          backPressCount = 1;
          
          // Réinitialiser le compteur après 2 secondes
          backPressTimer = setTimeout(() => {
            backPressCount = 0;
            backPressTimer = null;
          }, 2000);
          
          return true; // Empêcher le comportement par défaut
        } 
        
        // C'est le deuxième appui dans la fenêtre de temps
        // Laisser le comportement par défaut (quitter l'app)
        return false;
      } catch (error) {
        if (__DEV__) {
          console.warn('Erreur dans useDoubleBackToExit:', error);
        }
        return false;
      }
    };

    let backHandler: any = null;
    try {
      backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );
    } catch (error) {
      if (__DEV__) {
        console.warn('Erreur lors de l\'ajout du DoubleBackToExit:', error);
      }
      return;
    }

    return () => {
      try {
        if (backPressTimer) {
          clearTimeout(backPressTimer);
        }
        if (backHandler && backHandler.remove) {
          backHandler.remove();
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Erreur lors du nettoyage DoubleBackToExit:', error);
        }
      }
    };
  }, []);
}