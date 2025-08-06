import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Project, Building } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAndroidBackButton } from '@/utils/BackHandler';

export default function EditBuildingScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { projects, updateBuilding } = useStorage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [building, setBuilding] = useState<Building | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Configure Android back button to go back to the building screen
  useAndroidBackButton(() => {
    handleBack();
    return true;
  });

  useEffect(() => {
    loadBuilding();
  }, [id, projects]);

  const loadBuilding = async () => {
    try {
      console.log('🔍 Recherche du bâtiment avec ID:', id);
      for (const proj of projects) {
        const foundBuilding = proj.buildings.find(b => b.id === id);
        if (foundBuilding) {
          console.log('✅ Bâtiment trouvé:', foundBuilding.name);
          setBuilding(foundBuilding);
          setProject(proj);
          setName(foundBuilding.name);
          setDescription(foundBuilding.description || '');
          return;
        }
      }
      console.error('❌ Bâtiment non trouvé avec ID:', id);
    } catch (error) {
      console.error('Erreur lors du chargement du bâtiment:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // CORRIGÉ : Retourner vers la page du bâtiment (et non du projet)
  const handleBack = () => {
    try {
      if (building) {
        router.push(`/(tabs)/building/${building.id}`);
      } else if (project) {
        router.push(`/(tabs)/project/${project.id}`);
      } else {
        router.push('/(tabs)/');
      }
    } catch (error) {
      console.error('Erreur de navigation:', error);
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

  const handleSave = async () => {
    if (!validateForm() || !building) return;

    setLoading(true);
    try {
      console.log('💾 Sauvegarde du bâtiment:', building.id);
      
      const updatedBuilding = await updateBuilding(building.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (updatedBuilding) {
        console.log('✅ Bâtiment mis à jour avec succès');
        // CORRIGÉ : Retourner vers la page du bâtiment (et non du projet)
        router.push(`/(tabs)/building/${building.id}`);
      } else {
        console.error('❌ Erreur: Bâtiment non trouvé pour la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du bâtiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <Header title={strings.loading} onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{strings.loadingData}</Text>
        </View>
      </View>
    );
  }

  if (!building || !project) {
    return (
      <View style={styles.container}>
        <Header title={strings.itemNotFound} onBack={handleBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{strings.dataNotFound}</Text>
        </View>
      </View>
    );
  }

  const locationInfo = project.city ? `${project.name} • ${project.city}` : project.name;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Header
        title={strings.editBuilding}
        subtitle={locationInfo}
        onBack={handleBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={`${strings.buildingName} *`}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Bâtiment A, Tour Nord"
          error={errors.name}
        />

        <Input
          label={`Description (${strings.optional})`}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Bâtiment principal, 5 étages"
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Sauvegarde..." : strings.saveChanges}
            onPress={handleSave}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
  },
});