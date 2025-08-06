import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
  clearZeroOnFocus?: boolean;
}

export function Input({ label, error, containerStyle, style, clearZeroOnFocus = false, ...props }: InputProps) {
  const [hasBeenFocused, setHasBeenFocused] = useState(false);
  const { theme } = useTheme();

  const handleFocus = (e: any) => {
    if (clearZeroOnFocus && !hasBeenFocused && props.value === '0') {
      props.onChangeText?.('');
    }
    setHasBeenFocused(true);
    props.onFocus?.(e);
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          Platform.OS === 'web' && styles.inputWeb,
          style
        ]}
        placeholderTextColor={theme.colors.textTertiary}
        returnKeyType="done"
        blurOnSubmit={true}
        autoComplete="off"
        autoCorrect={false}
        spellCheck={false}
        {...props}
        onFocus={handleFocus}
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
  inputWeb: {
    // Optimisations spécifiques pour web mobile
    fontSize: 16, // Empêcher le zoom sur iOS Safari
    outlineWidth: 0,
    WebkitAppearance: 'none',
    WebkitTapHighlightColor: 'transparent',
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