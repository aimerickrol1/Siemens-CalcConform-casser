import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  style 
}: ButtonProps) {
  const { theme } = useTheme();

  const buttonStyle: ViewStyle[] = [
    styles.base,
    getVariantStyle(variant, theme),
    getSizeStyle(size),
    disabled && getDisabledStyle(theme),
    Platform.OS === 'web' && styles.webOptimized,
    style
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    getVariantTextStyle(variant, theme),
    getSizeTextStyle(size),
    disabled && getDisabledTextStyle(theme)
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={Platform.OS === 'web' ? 0.9 : 0.8}
    >
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const getVariantStyle = (variant: string, theme: any): ViewStyle => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.colors.primary,
      };
    case 'secondary':
      return {
        backgroundColor: theme.colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    case 'danger':
      return {
        backgroundColor: theme.colors.error,
      };
    default:
      return {};
  }
};

const getVariantTextStyle = (variant: string, theme: any): TextStyle => {
  switch (variant) {
    case 'primary':
      return {
        color: theme.mode === 'dark' ? theme.colors.text : '#FFFFFF',
      };
    case 'secondary':
      return {
        color: theme.colors.text,
      };
    case 'danger':
      return {
        color: '#FFFFFF',
      };
    default:
      return {};
  }
};

const getSizeStyle = (size: string): ViewStyle => {
  switch (size) {
    case 'small':
      return {
        paddingHorizontal: 12,
        paddingVertical: 8,
      };
    case 'medium':
      return {
        paddingHorizontal: 16,
        paddingVertical: 12,
      };
    case 'large':
      return {
        paddingHorizontal: 20,
        paddingVertical: 16,
      };
    default:
      return {};
  }
};

const getSizeTextStyle = (size: string): TextStyle => {
  switch (size) {
    case 'small':
      return {
        fontSize: 14,
      };
    case 'medium':
      return {
        fontSize: 16,
      };
    case 'large':
      return {
        fontSize: 18,
      };
    default:
      return {};
  }
};

const getDisabledStyle = (theme: any): ViewStyle => ({
  opacity: 0.5,
});

const getDisabledTextStyle = (theme: any): TextStyle => ({
  color: theme.colors.textTertiary,
});

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webOptimized: {
    // Optimisations pour web mobile
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    WebkitUserSelect: 'none',
  },
  text: {
    fontFamily: 'Inter-Medium',
  },
});