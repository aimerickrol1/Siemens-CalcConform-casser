import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface InlineNoteEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  onPress: () => void;
  onBlur: () => void;
  isEditing: boolean;
  placeholder: string;
  multiline?: boolean;
  style?: any;
}

export function InlineNoteEditor({
  value,
  onValueChange,
  onPress,
  onBlur,
  isEditing,
  placeholder,
  multiline = false,
  style
}: InlineNoteEditorProps) {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);

  // Focus automatique quand on passe en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isEditing]);

  const handlePress = () => {
    if (!isEditing) {
      onPress();
    }
  };

  const handleBlur = () => {
    onBlur();
  };

  const styles = createStyles(theme);

  if (isEditing) {
    return (
      <View style={styles.editingContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            style
          ]}
          value={value}
          onChangeText={onValueChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          multiline={multiline}
          numberOfLines={multiline ? 10 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          returnKeyType={multiline ? 'default' : 'done'}
          blurOnSubmit={!multiline}
          autoCorrect={true}
          spellCheck={true}
          selectTextOnFocus={false}
        />
        <View style={styles.editingIndicator}>
          <Text style={styles.editingText}>✏️ Édition en cours...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.displayContainer, !value && styles.emptyContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.displayText,
        !value && styles.placeholderText,
        style
      ]}>
        {value || placeholder}
      </Text>
      <View style={styles.editHint}>
        <Text style={styles.editHintText}>Cliquer pour modifier</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  editingContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    minHeight: 48,
    ...(Platform.OS === 'web' && {
      outlineWidth: 0,
      WebkitAppearance: 'none',
    }),
  },
  textInputMultiline: {
    minHeight: 200,
    maxHeight: 400,
  },
  editingIndicator: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editingText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  displayContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  emptyContainer: {
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  displayText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    lineHeight: 24,
  },
  placeholderText: {
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  editHint: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    opacity: 0.8,
  },
  editHintText: {
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
  },
});