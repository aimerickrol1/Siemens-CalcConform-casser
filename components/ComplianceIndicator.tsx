import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComplianceResult } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface ComplianceIndicatorProps {
  compliance: ComplianceResult;
  size?: 'small' | 'medium' | 'large';
}

export function ComplianceIndicator({ compliance, size = 'medium' }: ComplianceIndicatorProps) {
  const { theme } = useTheme();
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const textSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  const getIcon = () => {
    switch (compliance.status) {
      case 'compliant':
        return <Ionicons name="checkmark-circle" size={iconSize} color={compliance.color} />;
      case 'acceptable':
        return <Ionicons name="warning" size={iconSize} color={compliance.color} />;
      case 'non-compliant':
        return <Ionicons name="close-circle" size={iconSize} color={compliance.color} />;
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {getIcon()}
      <Text style={[styles.label, { color: compliance.color, fontSize: textSize }]}>
        {compliance.label}
      </Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'Inter-Medium',
    lineHeight: undefined,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});