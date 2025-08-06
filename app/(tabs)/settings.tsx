import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Settings as SettingsIcon, Globe, Trash2, Download, Info, Database, ChevronRight, CircleCheck as CheckCircle, X, Moon, Sun, Smartphone } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';
import { getLanguageOptions, SupportedLanguage } from '@/utils/i18n';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { strings, currentLanguage, changeLanguage } = useLanguage();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { showModal, hideModal } = useModal();
  const { clearAllData, getStorageInfo } = useStorage();
  const [storageInfo, setStorageInfo] = useState<{
    projectsCount: number;
    totalShutters: number;
    storageSize: string;
  } | null>(null);

  React.useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const info = getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Erreur lors du chargement des infos de stockage:', error);
    }
  };

  const handleBack = () => {
    try {
      if (router.canDismiss()) {
        router.dismiss();
        return;
      }
      
      router.navigate('/(tabs)/');
    } catch (error) {
      console.error('Erreur de navigation:', error);
      try {
        router.push('/(tabs)/');
      } catch (fallbackError) {
        console.error('Erreur de navigation fallback:', fallbackError);
      }
    }
  };

  const handleLanguageSelect = (languageCode: SupportedLanguage) => {
    changeLanguage(languageCode);
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode).catch(error => {
      console.error('Erreur lors du changement de thème:', error);
    });
  };

  const handleClearAllData = () => {
    showModal(
      <ClearDataModal onConfirm={confirmClearData} onCancel={hideModal} />,
      { animationType: 'fade' }
    );
  };

  const confirmClearData = async () => {
    try {
      await clearAllData();
      Alert.alert(
        strings.dataCleared,
        strings.dataClearedDesc,
        [{ 
          text: strings.ok, 
          onPress: () => {
            loadStorageInfo();
            try {
              router.replace('/(tabs)/');
            } catch (error) {
              console.error('Erreur de navigation:', error);
              setTimeout(() => {
                router.replace('/(tabs)/');
              }, 100);
            }
          }
        }]
      );
    } catch (error) {
      Alert.alert(
        strings.error,
        'Impossible de supprimer les données. Veuillez réessayer.',
        [{ text: strings.ok }]
      );
    }
  };

  const handleExportData = () => {
    router.push('/(tabs)/export');
  };

  const handleAbout = () => {
    router.push('/(tabs)/about');
  };

  const showLanguageModal = () => {
    showModal(
      <LanguageModal 
        currentLanguage={currentLanguage}
        onLanguageSelect={handleLanguageSelect}
      />,
      { animationType: 'fade' }
    );
  };

  const showThemeModal = () => {
    showModal(
      <ThemeModal 
        currentTheme={themeMode}
        onThemeSelect={handleThemeSelect}
      />,
      { animationType: 'fade' }
    );
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightContent?: React.ReactNode,
    danger?: boolean
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, danger && styles.settingItemDanger]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
          {icon}
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightContent || (onPress && <ChevronRight size={20} color={theme.colors.textTertiary} />)}
    </TouchableOpacity>
  );

  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return <Sun size={16} color={theme.colors.primary} />;
      case 'dark':
        return <Moon size={16} color={theme.colors.primary} />;
      case 'auto':
        return <Smartphone size={16} color={theme.colors.primary} />;
    }
  };

  const getThemeName = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Mode clair';
      case 'dark':
        return 'Mode sombre';
      case 'auto':
        return 'Mode automatique';
    }
  };

  const currentLangOption = getLanguageOptions().find(opt => opt.code === currentLanguage);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Header 
        title={strings.settingsTitle} 
        subtitle={strings.settingsSubtitle}
        onBack={handleBack}
        showSettings={true}
      />
      
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Section Apparence */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Apparence</Text>
            
            {renderSettingItem(
              getThemeIcon(themeMode),
              'Thème de l\'interface',
              getThemeName(themeMode),
              showThemeModal
            )}
          </View>

          {/* Section Langue */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌍 {strings.languageAndRegion}</Text>
            
            {renderSettingItem(
              <Globe size={20} color={theme.colors.primary} />,
              strings.interfaceLanguage,
              `${currentLangOption?.flag} ${currentLangOption?.name}`,
              showLanguageModal
            )}
          </View>

          {/* Section Données */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 {strings.dataManagement}</Text>
            
            {storageInfo && renderSettingItem(
              <Database size={20} color={theme.colors.primary} />,
              strings.storageUsed,
              `${storageInfo.projectsCount} projets • ${storageInfo.totalShutters} volets • ${storageInfo.storageSize}`
            )}

            {renderSettingItem(
              <Download size={20} color={theme.colors.success} />,
              strings.exportMyData,
              'Créer un rapport professionnel',
              handleExportData
            )}

            {renderSettingItem(
              <Trash2 size={20} color={theme.colors.error} />,
              strings.clearAllData,
              strings.clearAllDataDesc,
              handleClearAllData,
              undefined,
              true
            )}
          </View>

          {/* Section Application */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ {strings.applicationSection}</Text>
            
            {renderSettingItem(
              <Info size={20} color={theme.colors.primary} />,
              strings.about,
              'Version, développeur, conformité',
              handleAbout
            )}
          </View>
        </ScrollView>
      </View>

    </View>
  );
}

// Composant modal pour le thème
function ThemeModal({ currentTheme, onThemeSelect }: { currentTheme: ThemeMode; onThemeSelect: (mode: ThemeMode) => void }) {
  const { theme } = useTheme();
  const { hideModal } = useModal();
  const styles = createStyles(theme);

  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return <Sun size={16} color={theme.colors.primary} />;
      case 'dark':
        return <Moon size={16} color={theme.colors.primary} />;
      case 'auto':
        return <Smartphone size={16} color={theme.colors.primary} />;
    }
  };

  const getThemeName = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Mode clair';
      case 'dark':
        return 'Mode sombre';
      case 'auto':
        return 'Mode automatique';
    }
  };

  const handleSelect = (mode: ThemeMode) => {
    onThemeSelect(mode);
    hideModal();
  };

  return (
    <View style={styles.themeModalContent}>
      <View style={styles.modalHeader}>
        <Moon size={32} color={theme.colors.primary} />
        <Text style={styles.modalTitle}>Choisir le thème</Text>
        <TouchableOpacity 
          onPress={hideModal}
          style={styles.closeButton}
        >
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.themeList}>
        {(['light', 'dark', 'auto'] as ThemeMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.themeOption,
              currentTheme === mode && styles.themeOptionSelected
            ]}
            onPress={() => handleSelect(mode)}
          >
            {getThemeIcon(mode)}
            <View style={styles.themeOptionContent}>
              <Text style={[
                styles.themeOptionTitle,
                currentTheme === mode && styles.themeOptionTitleSelected
              ]}>
                {getThemeName(mode)}
              </Text>
              <Text style={styles.themeOptionDescription}>
                {mode === 'light' && <Text>Interface claire et lumineuse</Text>}
                {mode === 'dark' && <Text>Interface sombre et moderne</Text>}
                {mode === 'auto' && <Text>S'adapte au mode système</Text>}
              </Text>
            </View>
            {currentTheme === mode && (
              <CheckCircle size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Composant modal pour la langue
function LanguageModal({ currentLanguage, onLanguageSelect }: { currentLanguage: SupportedLanguage; onLanguageSelect: (lang: SupportedLanguage) => void }) {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { hideModal } = useModal();
  const styles = createStyles(theme);

  const handleSelect = (languageCode: SupportedLanguage) => {
    onLanguageSelect(languageCode);
    hideModal();
  };

  return (
    <View style={styles.languageModalContent}>
      <View style={styles.modalHeader}>
        <Globe size={32} color={theme.colors.primary} />
        <Text style={styles.modalTitle}>{strings.selectLanguage}</Text>
        <TouchableOpacity 
          onPress={hideModal}
          style={styles.closeButton}
        >
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.translationNote}>
        <Text style={styles.translationNoteTitle}>{strings.approximateTranslations}</Text>
        <Text style={styles.translationNoteText}>
          {strings.translationNote}
        </Text>
      </View>
      
      <View style={styles.languageList}>
        {getLanguageOptions().map((option) => (
          <TouchableOpacity
            key={option.code}
            style={[
              styles.languageOption,
              currentLanguage === option.code && styles.languageOptionSelected
            ]}
            onPress={() => handleSelect(option.code)}
          >
            <Text style={styles.languageFlag}>{option.flag}</Text>
            <Text style={[
              styles.languageName,
              currentLanguage === option.code && styles.languageNameSelected
            ]}>
              {option.name}
            </Text>
            {currentLanguage === option.code && (
              <CheckCircle size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Composant modal pour la confirmation de suppression
function ClearDataModal({ onConfirm, onCancel }: { onConfirm: () => Promise<void>; onCancel: () => void }) {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleConfirm = async () => {
    await onConfirm();
    onCancel();
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{strings.clearAllDataConfirm}</Text>
      </View>
      
      <Text style={styles.modalText}>
        <Text>⚠️ </Text>
        <Text style={styles.modalBold}>{strings.clearAllDataWarning}</Text>
        <Text>{'\n\n'}</Text>
        <Text>Tous vos projets, bâtiments, zones et volets seront définitivement supprimés.</Text>
        <Text>{'\n\n'}</Text>
        <Text>Assurez-vous d'avoir exporté vos données importantes avant de continuer.</Text>
      </Text>

      <View style={styles.modalFooter}>
        <Button
          title={strings.cancel}
          onPress={onCancel}
          variant="secondary"
          style={styles.modalButton}
        />
        <Button
          title={<Text>Supprimer tout</Text>}
          onPress={handleConfirm}
          variant="danger"
          style={styles.modalButton}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItemDanger: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDanger: {
    backgroundColor: theme.colors.error + '20',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  settingTitleDanger: {
    color: theme.colors.error,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    // Supprimé car maintenant géré par le ModalProvider
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  themeModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 450,
    maxHeight: '60%',
  },
  languageModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 450,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    flex: 1,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBold: {
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  themeList: {
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  themeOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  themeOptionTitleSelected: {
    color: theme.colors.primary,
  },
  themeOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  translationNote: {
    backgroundColor: theme.colors.warning + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  translationNoteTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.warning,
    marginBottom: 4,
  },
  translationNoteText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.warning,
    lineHeight: 16,
  },
  languageList: {
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  languageOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  languageNameSelected: {
    color: theme.colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
});