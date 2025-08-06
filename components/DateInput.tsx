import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DateInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: any;
}

export function DateInput({ label, value, onChangeText, placeholder, error, containerStyle }: DateInputProps) {
  const { theme } = useTheme();

  const formatDateInput = (text: string) => {
    // Supprimer tous les caractères non numériques
    const numbers = text.replace(/\D/g, '');
    
    // Limiter à 8 chiffres maximum (JJMMAAAA)
    const limitedNumbers = numbers.slice(0, 8);
    
    // Ajouter les "/" automatiquement
    let formatted = limitedNumbers;
    if (limitedNumbers.length >= 3) {
      formatted = limitedNumbers.slice(0, 2) + '/' + limitedNumbers.slice(2);
    }
    if (limitedNumbers.length >= 5) {
      formatted = limitedNumbers.slice(0, 2) + '/' + limitedNumbers.slice(2, 4) + '/' + limitedNumbers.slice(4);
    }
    
    return formatted;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatDateInput(text);
    onChangeText(formatted);
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType="numeric"
        maxLength={10} // JJ/MM/AAAA = 10 caractères
        returnKeyType="done"
        blurOnSubmit={true}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    minHeight: Platform.OS === 'ios' ? 48 : 44,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.error,
    marginTop: 4,
  },
});