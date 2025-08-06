import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Text, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Plus, Minus, X, Trash2 } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Button } from '@/components/Button';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface PredefinedZone {
  id: string;
  name: string;
  highShutters: number;
  lowShutters: number;
  referenceFlow?: number;
  useReferenceFlow: boolean;
}

interface PredefinedBuilding {
  id: string;
  name: string;
  zones: PredefinedZone[];
}

interface PredefinedStructure {
  enabled: boolean;
  buildings: PredefinedBuilding[];
}

export default function CreateProjectScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { projects, createProject, createBuilding, createFunctionalZone, createShutter } = useStorage();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  const [predefinedStructure, setPredefinedStructure] = useState<PredefinedStructure>({
    enabled: false,
    buildings: []
  });

  const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleBack = () => {
    router.push('/(tabs)/');
  };

  const validateForm = () => {
    const newErrors: { name?: string; startDate?: string; endDate?: string } = {};

    // Plus de validation obligatoire pour le nom
    // Un nom sera généré automatiquement si nécessaire

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

  const handleCreate = async () => {
    if (!validateForm()) return;

    // Générer un titre automatique si aucun titre n'est fourni
    let finalName = name.trim();
    if (!finalName) {
      const existingNames = projects.map(p => p.name).filter(n => n.startsWith('Projet sans titre'));
      const nextNumber = existingNames.length + 1;
      finalName = `Projet sans titre ${nextNumber}`;
    }

    setLoading(true);
    try {
      const projectData: any = {
        name: finalName,
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

      console.log('🏗️ Création du projet:', projectData.name, 'avec structure prédéfinie:', predefinedStructure.enabled);
      
      const project = await createProject(projectData);
      
      if (predefinedStructure.enabled && predefinedStructure.buildings.length > 0) {
        console.log('🏢 Création de la structure prédéfinie avec', predefinedStructure.buildings.length, 'bâtiments');
        
        for (const buildingData of predefinedStructure.buildings) {
          console.log('🏗️ Création du bâtiment:', buildingData.name);
          const building = await createBuilding(project.id, {
            name: buildingData.name,
          });
          
          if (building) {
            console.log('✅ Bâtiment créé:', building.id);
            for (const zoneData of buildingData.zones) {
              console.log('🏢 Création de la zone:', zoneData.name, 'avec', zoneData.highShutters, 'VH et', zoneData.lowShutters, 'VB');
              const zone = await createFunctionalZone(building.id, {
                name: zoneData.name,
              });
              
              if (zone) {
                console.log('✅ Zone créée:', zone.id);
                // Créer les volets hauts
                if (zoneData.highShutters > 0) {
                  console.log(`🔲 Création de ${zoneData.highShutters} volets hauts`);
                  for (let i = 1; i <= zoneData.highShutters; i++) {
                    const shutterName = `VH${i.toString().padStart(2, '0')}`;
                    console.log(`  - Création volet ${shutterName}`);
                    try {
                      const shutter = await createShutter(zone.id, {
                        name: shutterName,
                        type: 'high',
                        referenceFlow: zoneData.referenceFlow || 0,
                        measuredFlow: 0,
                      });
                      console.log(`  ✅ Volet ${shutterName} créé:`, shutter?.id);
                    } catch (error) {
                      console.error(`  ❌ Erreur création volet ${shutterName}:`, error);
                    }
                  }
                }
                
                // Créer les volets bas
                if (zoneData.lowShutters > 0) {
                  console.log(`🔲 Création de ${zoneData.lowShutters} volets bas`);
                  for (let i = 1; i <= zoneData.lowShutters; i++) {
                    const shutterName = `VB${i.toString().padStart(2, '0')}`;
                    console.log(`  - Création volet ${shutterName}`);
                    try {
                      const shutter = await createShutter(zone.id, {
                        name: shutterName,
                        type: 'low',
                        referenceFlow: zoneData.referenceFlow || 0,
                        measuredFlow: 0,
                      });
                      console.log(`  ✅ Volet ${shutterName} créé:`, shutter?.id);
                    } catch (error) {
                      console.error(`  ❌ Erreur création volet ${shutterName}:`, error);
                    }
                  }
                }
              } else {
                console.error('❌ Erreur: Zone non créée pour', zoneData.name);
              }
            }
          } else {
            console.error('❌ Erreur: Bâtiment non créé pour', buildingData.name);
          }
        }
        console.log('✅ Structure prédéfinie créée avec succès');
      }
      
      // Navigation vers le projet créé
      router.replace(`/(tabs)/project/${project.id}`);
    } catch (error) {
      console.error('❌ Erreur lors de la création du projet:', error);
      Alert.alert(strings.error, 'Impossible de créer le projet. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const togglePredefinedStructure = () => {
    setPredefinedStructure(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
    
    // Si on active la structure prédéfinie et qu'il n'y a pas encore de bâtiments, en ajouter un par défaut
    if (!predefinedStructure.enabled && predefinedStructure.buildings.length === 0) {
      const newBuilding: PredefinedBuilding = {
        id: generateUniqueId(),
        name: `Bâtiment 1`,
        zones: [{
          id: generateUniqueId(),
          name: 'ZF01',
          highShutters: 2,
          lowShutters: 2,
          referenceFlow: undefined,
          useReferenceFlow: false
        }]
      };
      
      setPredefinedStructure(prev => ({
        ...prev,
        buildings: [newBuilding]
      }));
    }
  };

  const addBuilding = () => {
    const newBuilding: PredefinedBuilding = {
      id: generateUniqueId(),
      name: `Bâtiment ${predefinedStructure.buildings.length + 1}`,
      zones: [{
        id: generateUniqueId(),
        name: `ZF${(predefinedStructure.buildings.length + 1).toString().padStart(2, '0')}`,
        highShutters: 2,
        lowShutters: 2,
        referenceFlow: undefined,
        useReferenceFlow: false
      }]
    };
    
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: [...prev.buildings, newBuilding]
    }));
  };

  const removeBuilding = (buildingId: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.filter(b => b.id !== buildingId)
    }));
  };

  const updateBuildingName = (buildingId: string, name: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId ? { ...b, name } : b
      )
    }));
  };

  const addZone = (buildingId: string) => {
    const building = predefinedStructure.buildings.find(b => b.id === buildingId);
    const zoneNumber = building ? building.zones.length + 1 : 1;
    
    const newZone: PredefinedZone = {
      id: generateUniqueId(),
      name: `ZF${zoneNumber.toString().padStart(2, '0')}`,
      highShutters: 0,
      lowShutters: 0,
      referenceFlow: undefined,
      useReferenceFlow: false
    };

    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { ...b, zones: [...b.zones, newZone] }
          : b
      )
    }));
  };

  const removeZone = (buildingId: string, zoneId: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { ...b, zones: b.zones.filter(z => z.id !== zoneId) }
          : b
      )
    }));
  };

  const updateZoneName = (buildingId: string, zoneId: string, name: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { 
              ...b, 
              zones: b.zones.map(z => 
                z.id === zoneId ? { ...z, name } : z
              )
            }
          : b
      )
    }));
  };

  const updateShutterCount = (buildingId: string, zoneId: string, type: 'high' | 'low', count: number) => {
    const clampedCount = Math.max(0, Math.min(30, count));
    
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { 
              ...b, 
              zones: b.zones.map(z => 
                z.id === zoneId 
                  ? { 
                      ...z, 
                      [type === 'high' ? 'highShutters' : 'lowShutters']: clampedCount 
                    }
                  : z
              )
            }
          : b
      )
    }));
  };

  const toggleZoneReferenceFlow = (buildingId: string, zoneId: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { 
              ...b, 
              zones: b.zones.map(z => 
                z.id === zoneId 
                  ? { 
                      ...z, 
                      useReferenceFlow: !z.useReferenceFlow,
                      referenceFlow: !z.useReferenceFlow ? undefined : undefined
                    }
                  : z
              )
            }
          : b
      )
    }));
  };

  const updateZoneReferenceFlow = (buildingId: string, zoneId: string, flow: number | undefined) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { 
              ...b, 
              zones: b.zones.map(z => 
                z.id === zoneId 
                  ? { 
                      ...z, 
                      referenceFlow: flow
                    }
                  : z
              )
            }
          : b
      )
    }));
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Header
        title="Nouveau projet"
        onBack={handleBack}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section informations de base */}
          <View style={styles.basicInfoSection}>
            <Text style={styles.sectionTitle}>📋 Informations du projet</Text>
            
            <Input
              label="Nom du projet"
              value={name}
              onChangeText={setName}
              placeholder="Nom du projet"
              error={errors.name}
            />

            <Input
              label="Ville"
              value={city}
              onChangeText={setCity}
              placeholder="Ex: Paris, Lyon, Marseille"
            />

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <DateInput
                  label="Date de début"
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="JJ/MM/AAAA"
                  error={errors.startDate}
                  containerStyle={styles.dateInputContainer}
                />
              </View>
              <View style={styles.dateField}>
                <DateInput
                  label="Date de fin"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="JJ/MM/AAAA"
                  error={errors.endDate}
                  containerStyle={styles.dateInputContainer}
                />
              </View>
            </View>
          </View>

          {/* Section structure prédéfinie améliorée */}
          <View style={styles.predefinedSection}>
            <View style={styles.predefinedHeader}>
              <View style={styles.predefinedTitleContainer}>
                <Text style={styles.predefinedTitle}>🏗️ Structure prédéfinie</Text>
                <Text style={styles.predefinedSubtitle}>
                  Créez automatiquement vos bâtiments, zones et volets
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, predefinedStructure.enabled && styles.toggleActive]}
                onPress={togglePredefinedStructure}
              >
                <View style={[styles.toggleThumb, predefinedStructure.enabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            {predefinedStructure.enabled && (
              <View style={styles.predefinedContent}>
                {/* Liste des bâtiments */}
                <View style={styles.buildingsSection}>
                  <View style={styles.buildingsSectionHeader}>
                    <Text style={styles.buildingsSectionTitle}>🏢 Bâtiments ({predefinedStructure.buildings.length})</Text>
                    <TouchableOpacity style={styles.addBuildingButtonCompact} onPress={addBuilding}>
                      <Plus size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.buildingsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {predefinedStructure.buildings.map((building, buildingIndex) => (
                      <View key={building.id} style={styles.buildingCard}>
                        {/* Badge de suppression en haut à droite */}
                        <TouchableOpacity
                          style={styles.deleteBuildingBadge}
                          onPress={() => removeBuilding(building.id)}
                        >
                          <Trash2 size={14} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* En-tête du bâtiment amélioré */}
                        <View style={styles.buildingHeaderImproved}>
                          <TextInput
                            style={styles.buildingNameInputImproved}
                            value={building.name}
                            onChangeText={(text) => updateBuildingName(building.id, text)}
                            placeholder="Nom du bâtiment"
                            placeholderTextColor={theme.colors.textTertiary}
                          />
                        </View>

                        {/* Zones du bâtiment */}
                        <View style={styles.zonesContainerImproved}>
                          <View style={styles.zonesHeaderImproved}>
                            <Text style={styles.zonesTitleImproved}>Zones ({building.zones.length})</Text>
                            <TouchableOpacity
                              style={styles.addZoneButtonImproved}
                              onPress={() => addZone(building.id)}
                            >
                              <Plus size={16} color={theme.colors.primary} />
                             <Text style={styles.addZoneTextImproved}>Zone</Text>
                            </TouchableOpacity>
                          </View>

                          {building.zones.map((zone, zoneIndex) => (
                            <View key={zone.id} style={styles.zoneCardImproved}>
                              {/* Badge de suppression zone */}
                              <TouchableOpacity
                                style={styles.deleteZoneBadge}
                                onPress={() => removeZone(building.id, zone.id)}
                              >
                                <X size={12} color="#FFFFFF" />
                              </TouchableOpacity>

                              {/* En-tête zone amélioré */}
                              <View style={styles.zoneHeaderImproved}>
                                <TextInput
                                  style={styles.zoneNameInputImproved}
                                  value={zone.name}
                                  onChangeText={(text) => updateZoneName(building.id, zone.id, text)}
                                  placeholder="Nom de la zone"
                                  placeholderTextColor={theme.colors.textTertiary}
                                />
                              </View>

                              {/* Compteurs de volets améliorés */}
                              <View style={styles.shutterCountersImproved}>
                                <View style={styles.shutterCounterImproved}>
                                  <View style={styles.shutterCounterHeaderImproved}>
                                    <View style={[styles.shutterTypeDotImproved, { backgroundColor: '#10B981' }]} />
                                    <Text style={styles.shutterCounterLabelImproved}>VH</Text>
                                  </View>
                                  <View style={styles.counterControlsImproved}>
                                    <TouchableOpacity
                                      style={[styles.counterButtonImproved, zone.highShutters <= 0 && styles.counterButtonDisabled]}
                                      onPress={() => updateShutterCount(building.id, zone.id, 'high', zone.highShutters - 1)}
                                      disabled={zone.highShutters <= 0}
                                      activeOpacity={0.7}
                                    >
                                      <Minus size={16} color={zone.highShutters <= 0 ? theme.colors.textTertiary : '#FFFFFF'} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterValueImproved}>{zone.highShutters}</Text>
                                    <TouchableOpacity
                                      style={[styles.counterButtonImproved, zone.highShutters >= 30 && styles.counterButtonDisabled]}
                                      onPress={() => updateShutterCount(building.id, zone.id, 'high', zone.highShutters + 1)}
                                      disabled={zone.highShutters >= 30}
                                      activeOpacity={0.7}
                                    >
                                      <Plus size={16} color={zone.highShutters >= 30 ? theme.colors.textTertiary : '#FFFFFF'} />
                                    </TouchableOpacity>
                                  </View>
                                </View>

                                <View style={styles.shutterCounterImproved}>
                                  <View style={styles.shutterCounterHeaderImproved}>
                                    <View style={[styles.shutterTypeDotImproved, { backgroundColor: '#F59E0B' }]} />
                                    <Text style={styles.shutterCounterLabelImproved}>VB</Text>
                                  </View>
                                  <View style={styles.counterControlsImproved}>
                                    <TouchableOpacity
                                      style={[styles.counterButtonImproved, zone.lowShutters <= 0 && styles.counterButtonDisabled]}
                                      onPress={() => updateShutterCount(building.id, zone.id, 'low', zone.lowShutters - 1)}
                                      disabled={zone.lowShutters <= 0}
                                      activeOpacity={0.7}
                                    >
                                      <Minus size={16} color={zone.lowShutters <= 0 ? theme.colors.textTertiary : '#FFFFFF'} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterValueImproved}>{zone.lowShutters}</Text>
                                    <TouchableOpacity
                                      style={[styles.counterButtonImproved, zone.lowShutters >= 30 && styles.counterButtonDisabled]}
                                      onPress={() => updateShutterCount(building.id, zone.id, 'low', zone.lowShutters + 1)}
                                      disabled={zone.lowShutters >= 30}
                                      activeOpacity={0.7}
                                    >
                                      <Plus size={16} color={zone.lowShutters >= 30 ? theme.colors.textTertiary : '#FFFFFF'} />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>

                              {/* Résumé de la zone */}
                              <View style={styles.zoneSummary}>
                                <Text style={styles.zoneSummaryText}>
                                  Total: {zone.highShutters + zone.lowShutters} volets
                                </Text>
                              </View>

                              {/* Configuration débit de référence par zone */}
                              <View style={styles.zoneReferenceFlowSection}>
                                <View style={styles.zoneReferenceFlowHeader}>
                                  <Text style={styles.zoneReferenceFlowTitle}>⚙️ Débit de référence</Text>
                                  <TouchableOpacity
                                    style={[styles.zoneToggle, zone.useReferenceFlow && styles.zoneToggleActive]}
                                    onPress={() => toggleZoneReferenceFlow(building.id, zone.id)}
                                  >
                                    <View style={[styles.zoneToggleThumb, zone.useReferenceFlow && styles.zoneToggleThumbActive]} />
                                  </TouchableOpacity>
                                </View>
                                
                                {zone.useReferenceFlow && (
                                  <View style={styles.zoneReferenceFlowInput}>
                                    <TextInput
                                      style={styles.referenceFlowInput}
                                      value={zone.referenceFlow?.toString() || ''}
                                      onChangeText={(text) => {
                                        const value = text.trim() === '' ? undefined : parseFloat(text) || undefined;
                                        updateZoneReferenceFlow(building.id, zone.id, value);
                                      }}
                                      placeholder="Ex: 5000"
                                      placeholderTextColor={theme.colors.textTertiary}
                                      keyboardType="numeric"
                                    />
                                    <Text style={styles.referenceFlowUnit}>m³/h</Text>
                                  </View>
                                )}
                                
                                {zone.useReferenceFlow && (
                                  <Text style={styles.zoneReferenceFlowDescription}>
                                    💡 Appliqué automatiquement aux {zone.highShutters + zone.lowShutters} volets de cette zone
                                  </Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bouton fixe en bas */}
      <View style={styles.fixedFooter}>
        <Button
          title={loading ? "Création..." : "Créer le projet"}
          onPress={handleCreate}
          disabled={loading}
          style={styles.createButton}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 140, // Espace pour le bouton fixe
  },
  
  // Section informations de base
  basicInfoSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateInputContainer: {
    marginBottom: 0,
    flex: 1,
  },
  
  // Section structure prédéfinie améliorée
  predefinedSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  predefinedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  predefinedTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  predefinedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  predefinedSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
    flexShrink: 0,
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 18 }],
  },
  predefinedContent: {
    marginTop: 8,
  },
  
  // Section bâtiments
  buildingsSection: {
    flex: 1,
  },
  buildingsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  defaultFlowContainer: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buildingsSectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  addBuildingButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addBuildingTextCompact: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
  },
  buildingsScroll: {
    maxHeight: 350,
  },
  
  // Cartes de bâtiment améliorées
  buildingCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  
  // Badge de suppression bâtiment (en haut à droite)
  deleteBuildingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  
  // En-tête bâtiment amélioré
  buildingHeaderImproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 10,
    paddingRight: 30, // Espace pour le badge de suppression
  },
  buildingNameInputImproved: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    minHeight: 36,
  },
  
  // Conteneur zones amélioré
  zonesContainerImproved: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  zonesHeaderImproved: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  zonesTitleImproved: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  addZoneButtonImproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addZoneTextImproved: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
  },
  
  // Cartes zone complètement repensées
  zoneCardImproved: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  
  // Badge de suppression zone
  deleteZoneBadge: {
    position: 'absolute',
   top: 12, // Aligné avec le champ nom de zone
   right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  
  // En-tête zone amélioré
  zoneHeaderImproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 12,
    paddingRight: 26, // Espace pour le badge de suppression
  },
  zoneNameInputImproved: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    minHeight: 32,
  },
  
  // Compteurs de volets complètement repensés
  shutterCountersImproved: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  shutterCounterImproved: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shutterCounterHeaderImproved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 6,
  },
  shutterTypeDotImproved: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shutterCounterLabelImproved: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  counterControlsImproved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  counterButtonImproved: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  counterButtonDisabled: {
    backgroundColor: theme.colors.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  counterValueImproved: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  
  // Résumé zone amélioré
  zoneSummary: {
    alignItems: 'center', 
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 4,
    marginBottom: 8,
  },
  zoneSummaryText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Configuration débit de référence par zone
  zoneReferenceFlowSection: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  zoneReferenceFlowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  zoneReferenceFlowTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
  },
  zoneToggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  zoneToggleActive: {
    backgroundColor: theme.colors.primary,
  },
  zoneToggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  zoneToggleThumbActive: {
    transform: [{ translateX: 14 }],
  },
  zoneReferenceFlowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  referenceFlowInput: {
    flex: 0,
    width: 80,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    textAlign: 'center',
    minHeight: 32,
  },
  referenceFlowUnit: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  zoneReferenceFlowDescription: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: theme.colors.primary,
    lineHeight: 13,
    fontStyle: 'italic',
  },
  
  // Bouton fixe en bas
  fixedFooter: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  createButton: {
    width: '100%',
  },
});