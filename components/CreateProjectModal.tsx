import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModal } from '@/contexts/ModalContext';

interface PredefinedZone {
  id: string;
  name: string;
  highShutters: number;
  lowShutters: number;
}

interface PredefinedBuilding {
  id: string;
  name: string;
  zones: PredefinedZone[];
}

interface PredefinedStructure {
  enabled: boolean;
  defaultReferenceFlow?: number;
  buildings: PredefinedBuilding[];
}

interface CreateProjectModalProps {
  onSubmit: (data: any, structure: PredefinedStructure) => void;
  loading: boolean;
}

export function CreateProjectModal({ onSubmit, loading }: CreateProjectModalProps) {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { hideModal } = useModal();
  const modalScrollViewRef = useRef<ScrollView>(null);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  const [predefinedStructure, setPredefinedStructure] = useState<PredefinedStructure>({
    enabled: false,
    defaultReferenceFlow: undefined,
    buildings: []
  });

  const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const resetForm = () => {
    setName('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setErrors({});
    setPredefinedStructure({
      enabled: false,
      defaultReferenceFlow: undefined,
      buildings: []
    });
  };

  // Réinitialiser le formulaire au montage
  useEffect(() => {
    resetForm();
  }, []);

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

    if (newErrors.name && modalScrollViewRef.current) {
      setTimeout(() => {
        modalScrollViewRef.current?.scrollTo({ 
          y: 0, 
          animated: true 
        });
      }, 100);
    }

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

  const handleSubmit = () => {
    if (!validateForm()) return;

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

    onSubmit(projectData, predefinedStructure);
    hideModal();
  };

  const handleClose = () => {
    resetForm();
    hideModal();
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
          lowShutters: 2
        }]
      };
      
      setPredefinedStructure(prev => ({
        ...prev,
        defaultReferenceFlow: undefined,
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
        lowShutters: 2
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
      lowShutters: 0
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

  const styles = createStyles(theme);

  return (
    <>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nouveau projet</Text>
          <TouchableOpacity 
            onPress={handleClose}
            style={styles.closeButton}
          >
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={modalScrollViewRef}
          style={styles.modalBody} 
          contentContainerStyle={styles.modalBodyContent}
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

            {/* Section prédéfinition de structure */}
            <View style={styles.predefinedToggleSection}>
              <View style={styles.toggleHeader}>
                <Text style={styles.toggleTitle}>🏗️ Prédéfinir la structure (optionnel)</Text>
                <TouchableOpacity
                  style={[styles.toggle, predefinedStructure.enabled && styles.toggleActive]}
                  onPress={togglePredefinedStructure}
                >
                  <View style={[styles.toggleThumb, predefinedStructure.enabled && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.toggleDescription}>
                Créez automatiquement vos bâtiments, zones et volets
              </Text>
            </View>

            {predefinedStructure.enabled && (
              <View style={styles.predefinedSection}>
                <Text style={styles.predefinedTitle}>🏗️ Structure prédéfinie</Text>
                
                <View style={styles.defaultFlowContainer}>
                  <Input
                    label="Débit de référence par défaut (m³/h) - Optionnel"
                    value={predefinedStructure.defaultReferenceFlow?.toString() || ''}
                    onChangeText={(text) => {
                      const value = text.trim() === '' ? undefined : parseFloat(text) || undefined;
                      setPredefinedStructure(prev => ({
                        ...prev,
                        defaultReferenceFlow: value
                      }));
                    }}
                    placeholder="Ex: 5000"
                    keyboardType="numeric"
                  />
                  <Text style={styles.defaultFlowDescription}>
                    Si renseigné, cette valeur sera appliquée automatiquement à tous les volets créés dans cette structure.
                  </Text>
                </View>
                
                <ScrollView style={styles.predefinedScroll} nestedScrollEnabled>
                  {predefinedStructure.buildings.map((building) => (
                    <View key={building.id} style={styles.buildingContainer}>
                      <View style={styles.buildingHeader}>
                        <TextInput
                          style={styles.buildingNameInput}
                          value={building.name}
                          onChangeText={(text) => updateBuildingName(building.id, text)}
                          placeholder="Nom du bâtiment"
                          placeholderTextColor={theme.colors.textTertiary}
                        />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeBuilding(building.id)}
                        >
                          <X size={16} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.addZoneButton}
                        onPress={() => addZone(building.id)}
                      >
                        <Plus size={16} color={theme.colors.primary} />
                        <Text style={styles.addZoneText}>Ajouter une zone</Text>
                      </TouchableOpacity>

                      {building.zones.map((zone) => (
                        <View key={zone.id} style={styles.zoneContainer}>
                          <View style={styles.zoneHeader}>
                            <TextInput
                              style={styles.zoneNameInput}
                              value={zone.name}
                              onChangeText={(text) => updateZoneName(building.id, zone.id, text)}
                              placeholder="Nom de la zone"
                              placeholderTextColor={theme.colors.textTertiary}
                            />
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => removeZone(building.id, zone.id)}
                            >
                              <X size={14} color={theme.colors.error} />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.shutterControls}>
                            <View style={styles.shutterControl}>
                              <Text style={styles.shutterLabel}>VH (Hauts)</Text>
                              <View style={styles.counterContainer}>
                                <TouchableOpacity
                                  style={styles.counterButton}
                                  onPress={() => updateShutterCount(building.id, zone.id, 'high', zone.highShutters - 1)}
                                >
                                  <Minus size={14} color={theme.colors.primary} />
                                </TouchableOpacity>
                                <Text style={styles.counterValue}>{zone.highShutters}</Text>
                                <TouchableOpacity
                                  style={styles.counterButton}
                                  onPress={() => updateShutterCount(building.id, zone.id, 'high', zone.highShutters + 1)}
                                >
                                  <Plus size={14} color={theme.colors.primary} />
                                </TouchableOpacity>
                              </View>
                            </View>

                            <View style={styles.shutterControl}>
                              <Text style={styles.shutterLabel}>VB (Bas)</Text>
                              <View style={styles.counterContainer}>
                                <TouchableOpacity
                                  style={styles.counterButton}
                                  onPress={() => updateShutterCount(building.id, zone.id, 'low', zone.lowShutters - 1)}
                                >
                                  <Minus size={14} color={theme.colors.primary} />
                                </TouchableOpacity>
                                <Text style={styles.counterValue}>{zone.lowShutters}</Text>
                                <TouchableOpacity
                                  style={styles.counterButton}
                                  onPress={() => updateShutterCount(building.id, zone.id, 'low', zone.lowShutters + 1)}
                                >
                                  <Plus size={14} color={theme.colors.primary} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addBuildingButton} onPress={addBuilding}>
                    <Plus size={20} color={theme.colors.primary} />
                    <Text style={styles.addBuildingText}>Ajouter un bâtiment</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
        </ScrollView>
      </View>

      {/* Bouton fixe en bas du viewport */}
      <View style={styles.fixedFooter}>
        <Button
          title="Annuler"
          onPress={handleClose}
          variant="secondary"
          style={styles.modalButton}
        />
        <Button
          title="Créer le projet"
          onPress={handleSubmit}
          disabled={loading}
          style={styles.modalButton}
        />
      </View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 600,
    height: Platform.OS === 'web' ? '85vh' : '90vh',
    flex: 1,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // Espace pour le bouton fixe
  },
  // Nouveau style pour le footer fixe au viewport
  fixedFooter: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 0,
    left: Platform.OS === 'web' ? '50%' : 0,
    right: Platform.OS === 'web' ? 'auto' : 0,
    ...(Platform.OS === 'web' && {
      transform: [{ translateX: '-50%' }],
      width: '100%',
      maxWidth: 560, // Largeur du modal moins padding
    }),
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderRadius: Platform.OS === 'web' ? 12 : 0,
    zIndex: 2147483647,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButton: {
    flex: 1,
  },
  predefinedToggleSection: {
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  toggleDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  predefinedSection: {
    marginTop: 16,
  },
  predefinedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  predefinedScroll: {
    maxHeight: 300,
  },
  buildingContainer: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buildingNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.error + '20',
  },
  addZoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    marginBottom: 12,
  },
  addZoneText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  zoneContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    backgroundColor: theme.colors.surfaceSecondary,
    color: theme.colors.text,
    marginRight: 8,
  },
  shutterControls: {
    flexDirection: 'row',
    gap: 16,
  },
  shutterControl: {
    flex: 1,
  },
  shutterLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
    padding: 4,
  },
  counterButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  counterValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  addBuildingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addBuildingText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  defaultFlowContainer: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  defaultFlowDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.primary,
    marginTop: 8,
    lineHeight: 16,
  },
});