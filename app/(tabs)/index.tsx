import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Platform, Alert, Animated } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Settings, Building, Star, Trash2, SquareCheck as CheckSquare, Square, X } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { ProjectCard } from '@/components/ProjectCard';
import { Project } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';
import { addEventListener } from '@/utils/EventEmitter';
import { LoadingScreen } from '@/components/LoadingScreen';

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

export default function ProjectsScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { showModal, hideModal } = useModal();
  const { 
    projects, 
    favoriteProjects, 
    createProject, 
    createBuilding, 
    createFunctionalZone, 
    createShutter, 
    deleteProject, 
    setFavoriteProjects 
  } = useStorage();
  
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fonction locale pour gérer l'ouverture du modal
  const handleCreateModal = useCallback(() => {
    console.log('📱 Ouverture du modal de création de projet');
    try {
      router.push('/(tabs)/project/create');
    } catch (error) {
      console.error('Erreur de navigation vers création projet:', error);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      console.log('📦 Chargement des projets...');
      console.log(`✅ ${projects.length} projets chargés`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des projets:', error);
    } finally {
      setLoading(false);
    }
  }, [projects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Projects screen focused, reloading data...');
      loadProjects();
      
      // Animation de fondu à l'entrée
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [loadProjects])
  );

  const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


  const handleProjectPress = (project: Project) => {
    if (selectionMode) {
      handleProjectSelection(project.id);
    } else {
      router.push(`/(tabs)/project/${project.id}`);
    }
  };

  const handleProjectLongPress = (project: Project) => {
    if (!selectionMode) {
      setSelectionMode(true);
      handleProjectSelection(project.id);
    }
  };

  const handleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(projectId)) {
        newSelection.delete(projectId);
      } else {
        newSelection.add(projectId);
      }
      return newSelection;
    });
  };

  const handleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedProjects(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedProjects.size === 0) return;

    showModal(<BulkDeleteProjectsModal 
      count={selectedProjects.size}
      onConfirm={() => confirmBulkDeleteProjects()}
      onCancel={() => hideModal()}
      strings={strings}
    />);
  };

  const handleBulkFavorite = async () => {
    if (selectedProjects.size === 0) return;

    const newFavorites = new Set(favoriteProjects);
    for (const projectId of selectedProjects) {
      if (newFavorites.has(projectId)) {
        newFavorites.delete(projectId);
      } else {
        newFavorites.add(projectId);
      }
    }
    
    await setFavoriteProjects(Array.from(newFavorites));
    setSelectedProjects(new Set());
    setSelectionMode(false);
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === sortedProjects.length) {
      // Si tout est sélectionné, tout désélectionner
      setSelectedProjects(new Set());
    } else {
      // Sinon, tout sélectionner
      const allProjectIds = new Set(sortedProjects.map(p => p.id));
      setSelectedProjects(allProjectIds);
    }
  };

  const handleToggleFavorite = async (projectId: string) => {
    // Protection contre null/undefined
    const newFavorites = new Set(favoriteProjects || []);
    if (newFavorites.has(projectId)) {
      newFavorites.delete(projectId);
    } else {
      newFavorites.add(projectId);
    }
    
    await setFavoriteProjects(Array.from(newFavorites));
  };

  const handleEditProject = (project: Project) => {
    router.push(`/(tabs)/project/edit/${project.id}`);
  };

  const handleDeleteProject = async (project: Project) => {
    showModal(<DeleteProjectModal 
      project={project}
      onConfirm={() => confirmDeleteProject(project)}
      onCancel={() => hideModal()}
      strings={strings}
    />);
  };

  const confirmDeleteProject = async (project: Project) => {
    try {
      const success = await deleteProject(project.id);
      if (success) {
        console.log('✅ Projet supprimé avec succès');
        hideModal();
      } else {
        console.error('❌ Erreur: Projet non trouvé pour la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Trier les projets : favoris en premier
  const sortedProjects = [...projects].sort((a, b) => {
    // Protection contre null/undefined
    const aIsFavorite = favoriteProjects?.includes(a.id) || false;
    const bIsFavorite = favoriteProjects?.includes(b.id) || false;
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // Si même statut de favori, trier par date de création (plus récent en premier)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const confirmBulkDeleteProjects = async () => {
    try {
      for (const projectId of selectedProjects) {
        const success = await deleteProject(projectId);
        if (!success) {
          console.error('Erreur lors de la suppression du projet:', projectId);
        }
      }
      setSelectedProjects(new Set());
      setSelectionMode(false);
      hideModal();
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error);
    }
  };

  const renderProject = ({ item }: { item: Project }) => (
    <ProjectCard
      project={item}
      isFavorite={favoriteProjects?.includes(item.id) || false}
      isSelected={selectedProjects.has(item.id)}
      selectionMode={selectionMode}
      onPress={() => handleProjectPress(item)}
      onLongPress={() => handleProjectLongPress(item)}
      onToggleFavorite={() => handleToggleFavorite(item.id)}
      onEdit={() => handleEditProject(item)}
      onDelete={() => handleDeleteProject(item)}
    />
  );

  const styles = createStyles(theme);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Header
        title={strings.projectsTitle}
        subtitle={strings.projectsSubtitle}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleSelectionMode} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>
                {selectionMode ? strings.cancel : 'Sélect.'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateModal} style={styles.actionButton}>
              <Plus size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {selectionMode && (
        <View style={styles.selectionToolbar}>
          <Text style={styles.selectionCount}>
            {selectedProjects.size} {strings.selected}{selectedProjects.size > 1 ? 's' : ''}
          </Text>
          <View style={styles.selectionActionsColumn}>
            <TouchableOpacity 
              style={[
                styles.selectAllButton,
                selectedProjects.size === sortedProjects.length 
                  ? styles.selectAllButtonActive 
                  : styles.selectAllButtonInactive
              ]}
              onPress={handleSelectAll}
            >
              {selectedProjects.size === sortedProjects.length ? (
                <CheckSquare size={20} color="#FFFFFF" />
              ) : (
                <Square size={20} color={theme.colors.textTertiary} />
              )}
              <Text style={[
                styles.selectAllButtonText,
                selectedProjects.size === sortedProjects.length 
                  ? styles.selectAllButtonTextActive 
                  : styles.selectAllButtonTextInactive
              ]}>
                {selectedProjects.size === sortedProjects.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Text>
            </TouchableOpacity>
            <View style={styles.selectionActionsRow}>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={handleBulkFavorite}
                disabled={selectedProjects.size === 0}
              >
                <Star size={20} color={selectedProjects.size > 0 ? "#F59E0B" : theme.colors.textTertiary} />
                <Text style={[styles.toolbarButtonText, { color: selectedProjects.size > 0 ? "#F59E0B" : theme.colors.textTertiary }]}>
                  {strings.favorites}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={handleBulkDelete}
                disabled={selectedProjects.size === 0}
              >
                <Trash2 size={20} color={selectedProjects.size > 0 ? theme.colors.error : theme.colors.textTertiary} />
                <Text style={[styles.toolbarButtonText, { color: selectedProjects.size > 0 ? theme.colors.error : theme.colors.textTertiary }]}>
                  {strings.delete}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.content, Platform.OS === 'web' && styles.contentWeb]}>
        {projects.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Building size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>{strings.noProjects}</Text>
            <Text style={styles.emptySubtitle}>
              {strings.noProjectsDesc}
            </Text>
            <Button
              title={strings.createFirstProject}
              onPress={handleCreateModal}
              style={styles.createButton}
            />
          </Animated.View>
        ) : (
          <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
            <FlatList
              data={sortedProjects}
              renderItem={renderProject}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContainer,
                Platform.OS === 'web' && styles.listContainerWeb
              ]}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        )}
      </View>

    </View>
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
  contentWeb: {
    paddingBottom: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  selectionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  actionButton: {
    padding: 8,
  },
  selectionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectionCount: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  selectionActions: {
    flexDirection: 'column',
    gap: 8,
  },
  selectionActionsColumn: {
    flexDirection: 'column',
    gap: 8,
  },
  selectionActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  selectAllButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  selectAllButtonInactive: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  selectAllButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  selectAllButtonTextActive: {
    color: '#FFFFFF',
  },
  selectAllButtonTextInactive: {
    color: theme.colors.textTertiary,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  toolbarButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    paddingHorizontal: 32,
  },
  listContainer: {
    padding: 16,
  },
  listContainerWeb: {
    paddingBottom: 16,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  modalBold: {
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
});

// Modal de confirmation pour la suppression en lot
const BulkDeleteProjectsModal = ({ count, onConfirm, onCancel, strings }: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  strings: any;
}) => {
  const { theme } = useTheme();
  const modalStyles = createStyles(theme);

  return (
    <View style={modalStyles.modalContent}>
      <View style={modalStyles.modalHeader}>
        <Text style={modalStyles.modalTitle}>
          {strings.confirmDelete || 'Confirmer la suppression'}
        </Text>
        <TouchableOpacity onPress={onCancel} style={modalStyles.closeButton}>
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={modalStyles.modalBody}>
        <Text style={modalStyles.modalText}>
          {strings.confirmBulkDeleteMessage || `Êtes-vous sûr de vouloir supprimer ${count} projet${count > 1 ? 's' : ''} ?`}
        </Text>
        <Text style={[modalStyles.modalText, modalStyles.modalBold]}>
          {strings.actionIrreversible || 'Cette action est irréversible.'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          style={[modalStyles.toolbarButton, { flex: 1, backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={onCancel}
        >
          <Text style={[modalStyles.toolbarButtonText, { color: theme.colors.textSecondary }]}>
            {strings.cancel || 'Annuler'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[modalStyles.toolbarButton, { flex: 1, backgroundColor: theme.colors.error }]}
          onPress={onConfirm}
        >
          <Text style={[modalStyles.toolbarButtonText, { color: 'white' }]}>
            {strings.delete || 'Supprimer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Modal de confirmation pour la suppression d'un projet
const DeleteProjectModal = ({ project, onConfirm, onCancel, strings }: {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
  strings: any;
}) => {
  const { theme } = useTheme();
  const modalStyles = createStyles(theme);

  return (
    <View style={modalStyles.modalContent}>
      <View style={modalStyles.modalHeader}>
        <Text style={modalStyles.modalTitle}>Supprimer le projet</Text>
        <TouchableOpacity onPress={onCancel} style={modalStyles.closeButton}>
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={modalStyles.modalBody}>
        <Text style={modalStyles.modalText}>
          <Text>⚠️ </Text>
          <Text style={modalStyles.modalBold}>Cette action est irréversible !</Text>
          <Text>{'\n\n'}</Text>
          <Text>Êtes-vous sûr de vouloir supprimer le projet </Text>
          <Text style={modalStyles.modalBold}>"{project.name}"</Text>
          <Text> ?</Text>
          <Text>{'\n\n'}</Text>
          <Text>Tous les bâtiments, zones et volets associés seront également supprimés.</Text>
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          style={[modalStyles.toolbarButton, { flex: 1, backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={onCancel}
        >
          <Text style={[modalStyles.toolbarButtonText, { color: theme.colors.textSecondary }]}>
            {strings.cancel || 'Annuler'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[modalStyles.toolbarButton, { flex: 1, backgroundColor: theme.colors.error }]}
          onPress={onConfirm}
        >
          <Text style={[modalStyles.toolbarButtonText, { color: 'white' }]}>
            Supprimer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};