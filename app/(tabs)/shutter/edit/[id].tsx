import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ComplianceIndicator } from '@/components/ComplianceIndicator';
import { Project, Building, FunctionalZone, Shutter, ShutterType } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { calculateCompliance, formatDeviation } from '@/utils/compliance';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAndroidBackButton } from '@/utils/BackHandler';

export default function EditShutterScreen() {
  const { strings, currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const { projects, updateShutter } = useStorage();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const [shutter, setShutter] = useState<Shutter | null>(null);
  const [zone, setZone] = useState<FunctionalZone | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<ShutterType>('high');
  const [referenceFlow, setReferenceFlow] = useState('');
  const [measuredFlow, setMeasuredFlow] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; referenceFlow?: string; measuredFlow?: string }>({});

  // Configure Android back button to go back to the shutter screen
  useAndroidBackButton(() => {
    handleBack();
    return true;
  });

  const getShutterPrefix = (shutterType: ShutterType, language: string) => {
    const prefixes = {
      fr: { high: 'VH', low: 'VB' },
      en: { high: 'HS', low: 'LS' },
      es: { high: 'CA', low: 'CB' },
      it: { high: 'SA', low: 'SB' },
    };
    
    return prefixes[language as keyof typeof prefixes]?.[shutterType] || prefixes.fr[shutterType];
  };

  useEffect(() => {
    loadShutter();
  }, [id, projects]);

  const loadShutter = async () => {
    try {
      console.log('🔍 Recherche du volet avec ID:', id);
      for (const proj of projects) {
        for (const bldg of proj.buildings) {
          for (const z of bldg.functionalZones) {
            const foundShutter = z.shutters.find(s => s.id === id);
            if (foundShutter) {
              console.log('✅ Volet trouvé:', foundShutter.name);
              setShutter(foundShutter);
              setZone(z);
              setBuilding(bldg);
              setProject(proj);
              
              setName(foundShutter.name);
              setType(foundShutter.type);
              setReferenceFlow(foundShutter.referenceFlow.toString());
              setMeasuredFlow(foundShutter.measuredFlow.toString());
              setRemarks(foundShutter.remarks || '');
              return;
            }
          }
        }
      }
      console.error('❌ Volet non trouvé avec ID:', id);
    } catch (error) {
      console.error('Erreur lors du chargement du volet:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // CORRIGÉ : Retourner vers la page du volet (et non de la zone)
  const handleBack = () => {
    try {
      if (shutter) {
        if (from === 'search') {
          router.push(`/(tabs)/shutter/${shutter.id}?from=search`);
        } else {
          router.push(`/(tabs)/shutter/${shutter.id}`);
        }
      } else if (from === 'search') {
        router.push('/(tabs)/search');
      } else if (zone) {
        router.push(`/(tabs)/zone/${zone.id}`);
      } else {
        router.push('/(tabs)/');
      }
    } catch (error) {
      console.error('Erreur de navigation:', error);
      router.push('/(tabs)/');
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; referenceFlow?: string; measuredFlow?: string } = {};

    if (!name.trim()) {
      newErrors.name = strings.nameRequired;
    }

    const refFlow = parseFloat(referenceFlow);
    if (!referenceFlow || isNaN(refFlow) || refFlow < 0) {
      newErrors.referenceFlow = strings.positiveOrZeroRequired;
    }

    const measFlow = parseFloat(measuredFlow);
    if (!measuredFlow || isNaN(measFlow) || measFlow < 0) {
      newErrors.measuredFlow = strings.positiveOrZeroRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !shutter) return;

    setLoading(true);
    try {
      console.log('💾 Sauvegarde du volet:', shutter.id);
      
      const updatedShutter = await updateShutter(shutter.id, {
        name: name.trim(),
        type,
        referenceFlow: parseFloat(referenceFlow),
        measuredFlow: parseFloat(measuredFlow),
        remarks: remarks.trim() || undefined,
      });

      if (updatedShutter) {
        console.log('✅ Volet mis à jour avec succès');
        // CORRIGÉ : Retourner vers la page du volet (et non de la zone)
        if (from === 'search') {
          router.push(`/(tabs)/shutter/${shutter.id}?from=search`);
        } else {
          router.push(`/(tabs)/shutter/${shutter.id}`);
        }
      } else {
        console.error('❌ Erreur: Volet non trouvé pour la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du volet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType: ShutterType) => {
    setType(newType);
    const newPrefix = getShutterPrefix(newType, currentLanguage);
    const oldPrefix = getShutterPrefix(newType === 'high' ? 'low' : 'high', currentLanguage);
    
    if (name.startsWith(oldPrefix)) {
      setName(name.replace(oldPrefix, newPrefix));
    } else {
      // Si le nom ne commence pas par un préfixe connu, on garde le nom existant
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

  if (!shutter || !zone || !building || !project) {
    return (
      <View style={styles.container}>
        <Header title={strings.itemNotFound} onBack={handleBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{strings.dataNotFound}</Text>
        </View>
      </View>
    );
  }

  const currentCompliance = calculateCompliance(parseFloat(referenceFlow) || 0, parseFloat(measuredFlow) || 0);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Header
        title={strings.editShutter}
        subtitle={`${zone.name} • ${building.name} • ${project.name}`}
        onBack={handleBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={`${strings.shutterName} *`}
          value={name}
          onChangeText={setName}
          placeholder={`Ex: ${getShutterPrefix('low', currentLanguage)}01, ${getShutterPrefix('high', currentLanguage)}01`}
          error={errors.name}
        />

        <View style={styles.typeContainer}>
          <Text style={styles.typeLabel}>{strings.shutterType} *</Text>
          <View style={styles.typeOptions}>
            <TouchableOpacity
              style={[styles.typeOption, type === 'high' && styles.typeOptionSelected]}
              onPress={() => handleTypeChange('high')}
            >
              <Text style={[styles.typeOptionText, type === 'high' && styles.typeOptionTextSelected]}>
                {strings.shutterHigh}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, type === 'low' && styles.typeOptionSelected]}
              onPress={() => handleTypeChange('low')}
            >
              <Text style={[styles.typeOptionText, type === 'low' && styles.typeOptionTextSelected]}>
                {strings.shutterLow}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Input
          label={`${strings.referenceFlow} (${strings.cubicMeterPerHour}) *`}
          value={referenceFlow}
          onChangeText={setReferenceFlow}
          placeholder="Ex: 5000"
          keyboardType="numeric"
          error={errors.referenceFlow}
        />

        <Input
          label={`${strings.measuredFlow} (${strings.cubicMeterPerHour}) *`}
          value={measuredFlow}
          onChangeText={setMeasuredFlow}
          placeholder="Ex: 4800"
          keyboardType="numeric"
          error={errors.measuredFlow}
        />

        <Input
          label={`${strings.remarks} (${strings.optional})`}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Observations, conditions de mesure..."
          multiline
          numberOfLines={3}
        />

        {referenceFlow && measuredFlow && !isNaN(parseFloat(referenceFlow)) && !isNaN(parseFloat(measuredFlow)) && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{strings.compliancePreview}</Text>
            
            <View style={styles.previewFlow}>
              <View style={styles.previewFlowItem}>
                <Text style={styles.previewFlowLabel}>{strings.calculatedDeviation}</Text>
                <Text style={[styles.previewFlowValue, { color: currentCompliance.color }]}>
                  {formatDeviation(currentCompliance.deviation)}
                </Text>
              </View>
            </View>

            <View style={styles.previewCompliance}>
              <ComplianceIndicator compliance={currentCompliance} size="medium" />
            </View>
          </View>
        )}

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
  typeContainer: {
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  typeOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  typeOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  typeOptionTextSelected: {
    color: theme.colors.primary,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  previewFlow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  previewFlowItem: {
    alignItems: 'center',
  },
  previewFlowLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  previewFlowValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  previewCompliance: {
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 24,
  },
});