import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStrings, setLanguage, getCurrentLanguage, initializeLanguage, SupportedLanguage, LanguageStrings } from '@/utils/i18n';

interface LanguageContextType {
  strings: LanguageStrings;
  currentLanguage: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [strings, setStrings] = useState<LanguageStrings>(getStrings());
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(getCurrentLanguage());

  useEffect(() => {
    // Initialiser la langue au démarrage
    try {
      initializeLanguage();
      const lang = getCurrentLanguage();
      setCurrentLanguage(lang);
      setStrings(getStrings());
      console.log('✅ Langue initialisée:', lang);
    } catch (error) {
      console.warn('Erreur lors de l\'initialisation de la langue:', error);
    }
  }, []);

  const changeLanguage = (lang: SupportedLanguage) => {
    try {
      setLanguage(lang);
      setCurrentLanguage(lang);
      setStrings(getStrings());
      console.log('✅ Langue changée vers:', lang);
    } catch (error) {
      console.warn('Erreur lors du changement de langue:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ strings, currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}