import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function CreateZoneScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { createFunctionalZone } = useStorage();
  const { buildingId } = useLocalSearchParams<{ buildingId: string }>();
  const [name, setName] = useState('ZF');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleBack = () => {
    if (buildingId) {
      // CORRIGÉ : Retourner vers le bâtiment (liste des zones)
      router.push(`/(tabs)/building/${buildingId}`);
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
    if (!validateForm() || !buildingId) return;

    setLoading(true);
    try {
      console.log('🏢 Création de la zone:', name.trim(), 'dans le bâtiment:', buildingId);
      
      const zone = await createFunctionalZone(buildingId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (zone) {
        console.log('✅ Zone créée avec succès:', zone.id);
        // CORRIGÉ : Naviguer vers la zone créée
        router.push(`/(tabs)/zone/${zone.id}`);
      } else {
        console.error('❌ Erreur: Zone non créée');
        Alert.alert(strings.error, 'Impossible de créer la zone. Bâtiment introuvable.');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la zone:', error);
      Alert.alert(strings.error, 'Impossible de créer la zone. Veuillez réessayer.');
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
        title={strings.newZone}
        onBack={handleBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={strings.zoneName + " *"}
          value={name}
          onChangeText={setName}
          placeholder="Ex: ZF01, Zone Hall"
          error={errors.name}
        />

        <Input
          label={`Description (${strings.optional})`}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Hall d'entrée principal"
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Création..." : strings.createZone}
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