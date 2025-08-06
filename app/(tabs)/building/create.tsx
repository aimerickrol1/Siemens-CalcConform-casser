import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function CreateBuildingScreen() {
  const { strings } = useLanguage();
  const { createBuilding } = useStorage();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const { theme } = useTheme();

  const handleBack = () => {
    if (projectId) {
      // CORRIGÉ : Retourner vers le projet (liste des bâtiments)
      router.push(`/(tabs)/project/${projectId}`);
    } else {
      router.push('/(tabs)/');
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = strings.nameRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm() || !projectId) return;

    setLoading(true);
    try {
      const building = await createBuilding(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (building) {
        // CORRIGÉ : Naviguer vers le bâtiment créé
        router.push(`/(tabs)/building/${building.id}`);
      } else {
        Alert.alert(strings.error, 'Impossible de créer le bâtiment. Projet introuvable.');
      }
    } catch (error) {
      Alert.alert(strings.error, 'Impossible de créer le bâtiment. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Header
        title={strings.newBuilding}
        onBack={handleBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={strings.buildingName + " *"}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Bâtiment A, Tour Nord"
          error={errors.name}
        />

        <Input
          label={`${strings.description} (${strings.optional})`}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Bâtiment principal, 5 étages"
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={strings.createBuilding}
            onPress={handleCreate}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 100,
  },
  buttonContainer: {
    marginTop: 24,
  },
});
