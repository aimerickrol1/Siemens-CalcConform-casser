import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Download, X, Share, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface InstallPromptProps {
  visible: boolean;
  onInstall: () => void;
  onClose: () => void;
  showAndroidInstructions?: boolean;
  onCloseAndroidInstructions?: () => void;
  showIOSInstructions?: boolean;
  onCloseIOSInstructions?: () => void;
  isIOSDevice?: boolean;
}

export function InstallPrompt({ 
  visible, 
  onInstall, 
  onClose, 
  showAndroidInstructions = false,
  onCloseAndroidInstructions,
  showIOSInstructions = false,
  onCloseIOSInstructions,
  isIOSDevice = false
}: InstallPromptProps) {
  const { theme } = useTheme();

  if (Platform.OS !== 'web') {
    return null;
  }

  // Afficher les instructions Android
  if (showAndroidInstructions) {
    return (
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <AndroidInstallTutorial onClose={onCloseAndroidInstructions} />
        </View>
      </View>
    );
  }

  // Afficher les instructions iOS
  if (showIOSInstructions && isIOSDevice) {
    return (
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <IOSInstallTutorial onClose={onCloseIOSInstructions} />
        </View>
      </View>
    );
  }

  return null;
}

// Composant tutoriel Android
function AndroidInstallTutorial({ onClose }: { onClose?: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.tutorialContent, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.tutorialHeader}>
        <View style={[styles.tutorialIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Download size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.tutorialTextContainer}>
          <Text style={[styles.tutorialTitle, { color: theme.colors.text }]}>Installer CalcConform</Text>
          <Text style={[styles.tutorialSubtitle, { color: theme.colors.textSecondary }]}>Ajoutez l'app à votre écran d'accueil</Text>
        </View>
        {onClose && (
          <TouchableOpacity style={[styles.tutorialCloseButton, { backgroundColor: theme.colors.surfaceSecondary }]} onPress={onClose}>
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.tutorialSteps}>
        <View style={styles.tutorialStep}>
          <View style={[styles.tutorialStepNumber, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.tutorialStepNumberText}>1</Text>
          </View>
          <View style={styles.tutorialStepContent}>
            <Text style={styles.tutorialStepIcon}>⋮</Text>
            <Text style={[styles.tutorialStepText, { color: theme.colors.text }]}>Ouvrez le menu du navigateur (3 points)</Text>
          </View>
        </View>
        
        <View style={styles.tutorialStep}>
          <View style={[styles.tutorialStepNumber, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.tutorialStepNumberText}>2</Text>
          </View>
          <View style={styles.tutorialStepContent}>
            <Download size={16} color={theme.colors.primary} />
            <Text style={[styles.tutorialStepText, { color: theme.colors.text }]}>Sélectionnez "Ajouter à l'écran d'accueil"</Text>
          </View>
        </View>
        
        <View style={styles.tutorialStep}>
          <View style={[styles.tutorialStepNumber, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.tutorialStepNumberText}>3</Text>
          </View>
          <View style={styles.tutorialStepContent}>
            <Text style={styles.tutorialStepIcon}>📱</Text>
            <Text style={[styles.tutorialStepText, { color: theme.colors.text }]}>Confirmez l'installation</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Composant tutoriel iOS
function IOSInstallTutorial({ onClose }: { onClose?: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.tutorialContent, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.tutorialHeader}>
        <View style={[styles.tutorialIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Share size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.tutorialTextContainer}>
          <Text style={[styles.tutorialTitle, { color: theme.colors.text }]}>Installer CalcConform</Text>
          <Text style={[styles.tutorialSubtitle, { color: theme.colors.textSecondary }]}>Ajoutez l'app à votre écran d'accueil</Text>
        </View>
        {onClose && (
          <TouchableOpacity style={[styles.tutorialCloseButton, { backgroundColor: theme.colors.surfaceSecondary }]} onPress={onClose}>
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.tutorialSteps}>
        <View style={styles.tutorialStep}>
          <View style={[styles.tutorialStepNumber, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.tutorialStepNumberText}>1</Text>
          </View>
          <View style={styles.tutorialStepContent}>
            <Share size={16} color={theme.colors.primary} />
            <Text style={[styles.tutorialStepText, { color: theme.colors.text }]}>Cliquez sur le bouton Partager</Text>
          </View>
        </View>
        
        <View style={styles.tutorialStep}>
          <View style={[styles.tutorialStepNumber, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.tutorialStepNumberText}>2</Text>
          </View>
          <View style={styles.tutorialStepContent}>
            <Plus size={16} color={theme.colors.primary} />
            <Text style={[styles.tutorialStepText, { color: theme.colors.text }]}>Sélectionnez "Ajouter à l'écran d'accueil"</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Export des composants pour utilisation dans d'autres pages
export { AndroidInstallTutorial, IOSInstallTutorial };

const styles = StyleSheet.create({
  // Overlay sombre centré
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  
  // Styles pour le contenu du tutoriel
  tutorialContent: {
    padding: 20,
    borderRadius: 16,
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  tutorialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialTextContainer: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  tutorialSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  tutorialCloseButton: {
    padding: 8,
    borderRadius: 8,
  },
  tutorialSteps: {
    gap: 16,
  },
  tutorialStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tutorialStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tutorialStepNumberText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tutorialStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tutorialStepText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    flex: 1,
    lineHeight: 22,
  },
  tutorialStepIcon: {
    fontSize: 18,
    width: 18,
    textAlign: 'center',
  },
});