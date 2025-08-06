import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Button } from '@/components/Button';
import { NumericInput } from '@/components/NumericInput';
import { storage } from '@/utils/storage';

export default function CreateProjectScreen() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  // États pour la prédéfinition de structure
  const [enableStructurePreset, setEnableStructurePreset] = useState(false);
  const [buildingCount, setBuildingCount] = useState(1);
  const [zonesPerBuilding, setZonesPerBuilding] = useState(1);
  const [highShuttersPerZone, setHighShuttersPerZone] = useState(1);
  const [lowShuttersPerZone, setLowShuttersPerZone] = useState(1);

  const handleBack = () => {
    router.push('/(tabs)/');
  };

  const validateForm = () => {
    const newErrors: { name?: string; startDate?: string; endDate?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom du projet est requis';
    }

    if (startDate && !isValidDate(startDate)) {
      newErrors.startDate = 'Format de date invalide (JJ/MM/AAAA)';
    }

    if (endDate && !isValidDate(endDate)) {
      newErrors.endDate = 'Format de date invalide (JJ/MM/AAAA)';
    }

    if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      if (end <= start) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidDate = (dateString: string): boolean => {
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(regex);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
  };

  const createStructurePreset = async (projectId: string) => {
    try {
      for (let b = 1; b <= buildingCount; b++) {
        const building = await storage.createBuilding(projectId, {
          name: `Bâtiment ${b}`,
          description: undefined
        });

        if (building) {
          for (let z = 1; z <= zonesPerBuilding; z++) {
            const zone = await storage.createFunctionalZone(building.id, {
              name: `ZF${z.toString().padStart(2, '0')}`,
              description: undefined
            });

            if (zone) {
              // Créer les volets hauts
              for (let vh = 1; vh <= highShuttersPerZone; vh++) {
                await storage.createShutter(zone.id, {
                  name: `VH${vh.toString().padStart(2, '0')}`,
                  type: 'high',
                  referenceFlow: 0,
                  measuredFlow: 0
                });
              }

              // Créer les volets bas
              for (let vb = 1; vb <= lowShuttersPerZone; vb++) {
                await storage.createShutter(zone.id, {
                  name: `VB${vb.toString().padStart(2, '0')}`,
                  type: 'low',
                  referenceFlow: 0,
                  measuredFlow: 0
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de la structure prédéfinie:', error);
      throw error;
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const projectData: any = {
        name: name.trim(),
      };

      if (city.trim()) {
        projectData.city = city.trim();
      }

      if (startDate && isValidDate(startDate)) {
        projectData.startDate = parseDate(startDate);
      }

      if (endDate && isValidDate(endDate)) {
        projectData.endDate = parseDate(endDate);
      }

      const project = await storage.createProject(projectData);

      // Créer la structure prédéfinie si activée
      if (enableStructurePreset) {
        await createStructurePreset(project.id);
      }

      router.replace(`/(tabs)/project/${project.id}`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le projet. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Header
        title="Nouveau projet"
        onBack={handleBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Nom du projet *"
          value={name}
          onChangeText={setName}
          placeholder="Ex: Mesures centre commercial Rivoli"
          error={errors.name}
        />

        <Input
          label="Ville (optionnel)"
          value={city}
          onChangeText={setCity}
          placeholder="Ex: Paris, Lyon, Marseille"
        />

        <DateInput
          label="Date de début (optionnel)"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="JJ/MM/AAAA"
          error={errors.startDate}
        />

        <DateInput
          label="Date de fin (optionnel)"
          value={endDate}
          onChangeText={setEndDate}
          placeholder="JJ/MM/AAAA"
          error={errors.endDate}
        />

        {/* Section Prédéfinition de structure - SANS SCROLL AUTOMATIQUE */}
        <View style={styles.structureSection}>
          <TouchableOpacity 
            style={styles.structureHeader}
            onPress={() => setEnableStructurePreset(!enableStructurePreset)}
            activeOpacity={0.7}
          >
            <View style={styles.structureTitle}>
              <Text style={styles.structureIcon}>🏗️</Text>
              <Text style={styles.structureTitleText}>Prédéfinir la structure (optionnel)</Text>
            </View>
            <View style={[styles.toggle, enableStructurePreset && styles.toggleActive]}>
              <View style={[styles.toggleThumb, enableStructurePreset && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.structureDescription}>
            Créez automatiquement vos bâtiments, zones et volets
          </Text>

          {enableStructurePreset && (
            <View style={styles.structureInputs}>
              <NumericInput
                label="🏢 Bâtiments (max 10)"
                value={buildingCount}
                onValueChange={setBuildingCount}
                min={1}
                max={10}
              />

              <NumericInput
                label="🏗️ Zones par bâtiment (max 20)"
                value={zonesPerBuilding}
                onValueChange={setZonesPerBuilding}
                min={1}
                max={20}
              />

              <View style={styles.shuttersSection}>
                <Text style={styles.shuttersTitle}>🔲 Volets par zone (max 30)</Text>
                
                <View style={styles.shutterInputsRow}>
                  <View style={styles.shutterInputContainer}>
                    <View style={styles.shutterTypeIndicator}>
                      <View style={[styles.shutterDot, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.shutterTypeLabel}>Volet Haut (VH)</Text>
                    </View>
                    <NumericInput
                      value={highShuttersPerZone}
                      onValueChange={setHighShuttersPerZone}
                      min={0}
                      max={30}
                      style={styles.shutterInput}
                    />
                  </View>

                  <View style={styles.shutterInputContainer}>
                    <View style={styles.shutterTypeIndicator}>
                      <View style={[styles.shutterDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={styles.shutterTypeLabel}>Volet Bas (VB)</Text>
                    </View>
                    <NumericInput
                      value={lowShuttersPerZone}
                      onValueChange={setLowShuttersPerZone}
                      min={0}
                      max={30}
                      style={styles.shutterInput}
                    />
                  </View>
                </View>
              </View>

              {/* Aperçu de la structure */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>📋 Aperçu de la structure</Text>
                <View style={styles.previewStats}>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatValue}>{buildingCount}</Text>
                    <Text style={styles.previewStatLabel}>Bâtiment{buildingCount > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatValue}>{buildingCount * zonesPerBuilding}</Text>
                    <Text style={styles.previewStatLabel}>Zone{buildingCount * zonesPerBuilding > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatValue}>
                      {buildingCount * zonesPerBuilding * (highShuttersPerZone + lowShuttersPerZone)}
                    </Text>
                    <Text style={styles.previewStatLabel}>Volet{buildingCount * zonesPerBuilding * (highShuttersPerZone + lowShuttersPerZone) > 1 ? 's' : ''}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Créer le projet"
            onPress={handleCreate}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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

  // Styles pour la section de prédéfinition de structure
  structureSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  structureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  structureTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  structureIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  structureTitleText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  structureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  
  // Toggle switch
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleActive: {
    backgroundColor: '#009999',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    position: 'absolute',
    left: 2,
  },
  toggleThumbActive: {
    left: 24,
  },

  // Inputs de structure
  structureInputs: {
    gap: 20,
  },
  
  // Section volets
  shuttersSection: {
    marginTop: 8,
  },
  shuttersTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  shutterInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shutterInputContainer: {
    flex: 1,
  },
  shutterTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  shutterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shutterTypeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  shutterInput: {
    marginBottom: 0,
  },

  // Aperçu de la structure
  previewContainer: {
    backgroundColor: '#F0FDFA',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#047857',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  previewStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#047857',
    marginTop: 2,
    textAlign: 'center',
  },
});