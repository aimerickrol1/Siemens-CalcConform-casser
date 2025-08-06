import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { CreditCard as Edit3, Trash2, Calendar, X, Check, Camera } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { InlineNoteEditor } from '@/components/InlineNoteEditor';
import { NoteImageGallery } from '@/components/NoteImageGallery';
import { Note } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';
import { useAndroidBackButton } from '@/utils/BackHandler';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function NoteDetailScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { showModal, hideModal } = useModal();
  const { notes, deleteNote, updateNote } = useStorage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState('');
  const [textInputHeight, setTextInputHeight] = useState(200); // Hauteur initiale
  const [contentHeight, setContentHeight] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configure Android back button
  useAndroidBackButton(() => {
    handleBack();
    return true;
  });

  const loadNote = useCallback(async () => {
    try {
      const foundNote = notes.find(n => n.id === id);
      setNote(foundNote || null);
    } catch (error) {
      console.error('Erreur lors du chargement de la note:', error);
    } finally {
      setLoading(false);
    }
  }, [id, notes]);

  useFocusEffect(
    useCallback(() => {
      console.log('Note screen focused, reloading data...');
      loadNote();
    }, [loadNote])
  );

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // Initialiser les valeurs d'édition quand la note change
  useEffect(() => {
    if (note) {
      setEditingContent(note.content || '');
    }
  }, [note]);

  const handleBack = () => {
    safeNavigate('/(tabs)/notes');
  };

  const safeNavigate = (path: string) => {
    try {
      if (router.canGoBack !== undefined) {
        router.push(path);
      } else {
        setTimeout(() => {
          router.push(path);
        }, 100);
      }
    } catch (error) {
      console.error('Erreur de navigation:', error);
      setTimeout(() => {
        try {
          router.push(path);
        } catch (retryError) {
          console.error('Erreur de navigation retry:', retryError);
        }
      }, 200);
    }
  };

  const handleEditTitle = () => {
    showModal(<EditNoteTitleDetailModal 
      note={note}
      onCancel={() => hideModal()}
      strings={strings}
    />);
  };

  const handleDelete = () => {
    if (!note) return;

    showModal(<DeleteNoteDetailModal 
      note={note}
      onConfirm={() => confirmDeleteNote()}
      onCancel={() => hideModal()}
      strings={strings}
    />);
  };

  const confirmDeleteNote = async () => {
    if (!note) return;

    try {
      console.log('🗑️ Confirmation suppression note:', note.id);
      const success = await deleteNote(note.id);
      if (success) {
        console.log('✅ Note supprimée avec succès');
        hideModal();
        handleBack();
      } else {
        console.error('❌ Erreur: Note non trouvée pour la suppression');
        hideModal();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      hideModal();
    }
  };

  // Auto-save avec debounce
  const autoSaveNote = useCallback(
    debounce(async (value: string) => {
      if (!note) return;
      
      try {
        console.log('💾 Auto-save content:', value.substring(0, 50) + '...');
        await updateNote(note.id, {
          content: value,
        });
        
        console.log('✅ Contenu sauvegardé automatiquement');
      } catch (error) {
        console.error('Erreur auto-save content:', error);
      }
    }, 3000), // Délai augmenté pour éviter les conflits
    [note, updateNote]
  );

  const handleContentEdit = (value: string) => {
    setEditingContent(value);
    // Seulement auto-save si la valeur n'est pas vide
    if (value.length > 0) {
      autoSaveNote(value);
    }
  };

  // Fonction pour calculer la hauteur optimale du TextInput
  const handleContentSizeChange = (event: any) => {
    const { height } = event.nativeEvent.contentSize;
    const minHeight = 200; // Hauteur minimale
    const maxHeight = Platform.OS === 'web' ? 600 : 500; // Hauteur maximale
    
    // Calculer la nouvelle hauteur en respectant les limites
    const newHeight = Math.max(minHeight, Math.min(height + 20, maxHeight));
    
    setContentHeight(height);
    setTextInputHeight(newHeight);
  };

  // Calculer si on a besoin d'un scroll interne
  const needsInternalScroll = contentHeight > (Platform.OS === 'web' ? 580 : 480);
  const handleAddImage = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Améliorer la qualité : augmenter la résolution maximale
        const maxDimension = Math.max(img.width, img.height);
        const targetMaxDimension = Math.min(maxDimension, 1920); // Augmenté de 800 à 1920
        
        const ratio = targetMaxDimension / maxDimension;
        const newWidth = Math.round(img.width * ratio);
        const newHeight = Math.round(img.height * ratio);

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Améliorer la qualité de rendu
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }

        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        // Convertir en base64 avec meilleure qualité
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.92); // Augmenté de 0.8 à 0.92
        console.log('Image compressée, format:', compressedBase64.substring(0, 30));
        resolve(compressedBase64);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file && file.type.startsWith('image/')) {
      try {
        console.log('📸 Image sélectionnée:', file.name, 'Taille:', file.size, 'Type:', file.type);
        
        // Compresser l'image pour le stockage
        const compressedBase64 = await compressImage(file);
        console.log('💾 Image compressée pour stockage, taille:', compressedBase64.length);
        
        if (note) {
          const currentImages = note.images || [];
          const updatedNote = await updateNote(note.id, {
            images: [...currentImages, compressedBase64],
          });
          if (updatedNote) {
            setNote(updatedNote);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la compression de l\'image:', error);
        // Fallback sans compression
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          console.log('📄 Fallback Base64 créé:', base64.substring(0, 30));
          if (note) {
            const currentImages = note.images || [];
            updateNote(note.id, {
              images: [...currentImages, base64],
            }).then(updatedNote => {
              if (updatedNote) {
                setNote(updatedNote);
              }
            });
          }
        };
        reader.readAsDataURL(file);
      }
    }
    
    // Reset input
    target.value = '';
  };

  const handleRemoveImage = async (index: number) => {
    if (!note) return;
    
    const currentImages = note.images || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    
    const updatedNote = await updateNote(note.id, {
      images: newImages.length > 0 ? newImages : undefined,
    });
    
    if (updatedNote) {
      setNote(updatedNote);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const styles = createStyles(theme);

  if (loading) {
    return <LoadingScreen title={strings.loading} message={strings.loadingData} />;
  }

  if (!note) {
    return (
      <View style={styles.container}>
        <Header title={strings.itemNotFound} onBack={handleBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{strings.dataNotFound}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={
          <TouchableOpacity 
            style={styles.titleContainer}
            onPress={handleEditTitle}
          >
            <Text style={styles.titleText} numberOfLines={1}>
              {note.title || strings.untitledNote}
            </Text>
            <Text style={styles.titleEditIcon}>✏️</Text>
          </TouchableOpacity>
        }
        onBack={handleBack}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleAddImage} style={styles.actionButton}>
              <Camera size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Trash2 size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Calendar size={16} color={theme.colors.textSecondary} />
            <Text style={styles.metaLabel}>Créé le</Text>
            <Text style={styles.metaValue}>{formatDate(note.createdAt)}</Text>
          </View>
          {note.updatedAt.getTime() !== note.createdAt.getTime() && (
            <View style={styles.metaRow}>
              <Calendar size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaLabel}>Modifié le</Text>
              <Text style={styles.metaValue}>{formatDate(note.updatedAt)}</Text>
            </View>
          )}
        </View>

        {/* Galerie d'images */}
        <NoteImageGallery
          images={note.images || []}
          onRemoveImage={handleRemoveImage}
          editable={true}
          noteId={note.id}
        />

        {/* Contenu de la note */}
        <View style={styles.contentSection}>
          <Text style={styles.contentLabel}>{strings.noteContent}</Text>
          <TextInput
            style={[
              styles.contentTextInput,
              { height: textInputHeight },
              needsInternalScroll && { maxHeight: Platform.OS === 'web' ? 600 : 500 }
            ]}
            value={editingContent}
            onChangeText={handleContentEdit}
            onContentSizeChange={handleContentSizeChange}
            placeholder={strings.writeYourNote}
            placeholderTextColor={theme.colors.textTertiary}
            multiline={true}
            textAlignVertical="top"
            scrollEnabled={needsInternalScroll}
            autoCorrect={true}
            spellCheck={true}
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>
      </ScrollView>

      {/* Input caché pour web */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e as any)}
        />
      )}
    </View>
  );
}

// Fonction utilitaire pour debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Modal de confirmation pour la suppression d'une note (page détail)
function DeleteNoteDetailModal({ note, onConfirm, onCancel, strings }: any) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Supprimer la note</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.modalBody}>
        <Text style={styles.modalText}>
          <Text>⚠️ </Text>
          <Text style={styles.modalBold}>Cette action est irréversible !</Text>
          <Text>{'\n\n'}</Text>
          <Text>Êtes-vous sûr de vouloir supprimer la note </Text>
          <Text style={styles.modalBold}>"{note.title || strings.untitledNote}"</Text>
          <Text> ?</Text>
        </Text>
      </View>

      <View style={styles.modalFooter}>
        <Button
          title={strings.cancel}
          onPress={onCancel}
          variant="secondary"
          style={styles.modalButton}
        />
        <Button
          title="Supprimer"
          onPress={onConfirm}
          variant="danger"
          style={styles.modalButton}
        />
      </View>
    </View>
  );
}

// Modal d'édition du titre de note (page détail)
function EditNoteTitleDetailModal({ note, onCancel, strings }: {
  note: Note;
  onCancel: () => void;
  strings: any;
}) {
  const { theme } = useTheme();
  const { hideModal } = useModal();
  const { updateNote } = useStorage();
  const [title, setTitle] = useState(note.title || '');
  const styles = createStyles(theme);

  const handleSave = async () => {
    if (!note) return;

    try {
      const updatedNote = await updateNote(note.id, {
        title: title.trim() || strings.untitledNote,
      });
      
      if (updatedNote) {
        // Mettre à jour l'état local de la note dans le composant parent
        // Note: Le parent se rechargera automatiquement via useFocusEffect
        hideModal();
      }
    } catch (error) {
      console.error('Erreur lors de la modification du titre:', error);
    }
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Modifier le titre de la note</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.modalBody}>
        <Text style={styles.inputLabel}>Titre de la note *</Text>
        <TextInput
          style={styles.titleTextInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Observations chantier, Mesures particulières..."
          placeholderTextColor={theme.colors.textTertiary}
          autoFocus={true}
          selectTextOnFocus={true}
          returnKeyType="done"
          blurOnSubmit={true}
        />
      </View>

      <View style={styles.modalFooter}>
        <Button
          title={strings.cancel}
          onPress={onCancel}
          variant="secondary"
          style={styles.modalButton}
        />
        <Button
          title={strings.save}
          onPress={handleSave}
          style={styles.modalButton}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 100 : 80, // Espace pour la barre de navigation
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  metaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    marginTop: 16,
  },
  contentTextInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    lineHeight: 24,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' && {
      outlineWidth: 0,
      resize: 'none',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }),
  },
  // Styles pour le modal
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
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceSecondary,
    maxWidth: 250,
  },
  titleText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    flex: 1,
  },
  titleEditIcon: {
    fontSize: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  titleTextInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    minHeight: 48,
  },
});