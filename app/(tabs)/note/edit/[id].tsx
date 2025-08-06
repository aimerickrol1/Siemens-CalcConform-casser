import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ImagePicker } from '@/components/ImagePicker';
import { NoteImageGallery } from '@/components/NoteImageGallery';
import { Note } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';
import { useAndroidBackButton } from '@/utils/BackHandler';

export default function EditNoteScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { showModal, hideModal } = useModal();
  const { notes, updateNote } = useStorage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string }>({});

  // Configure Android back button
  useAndroidBackButton(() => {
    handleBack();
    return true;
  });

  useEffect(() => {
    loadNote();
  }, [id, notes]);

  const loadNote = async () => {
    try {
      console.log('🔍 Recherche de la note avec ID:', id);
      const foundNote = notes.find(n => n.id === id);
      if (foundNote) {
        console.log('✅ Note trouvée:', foundNote.title);
        setNote(foundNote);
        setTitle(foundNote.title);
        setContent(foundNote.content);
        setImages(foundNote.images || []);
      } else {
        console.error('❌ Note non trouvée avec ID:', id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la note:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleBack = () => {
    if (note) {
      safeNavigate(`/(tabs)/note/${note.id}`);
    } else {
      safeNavigate('/(tabs)/notes');
    }
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

  const validateForm = () => {
    const newErrors: { title?: string } = {};

    if (!title.trim() && !content.trim() && images.length === 0) {
      newErrors.title = 'Le titre ou le contenu est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !note) return;

    setLoading(true);
    try {
      console.log('💾 Sauvegarde de la note:', note.id);
      
      const updatedNote = await updateNote(note.id, {
        title: title.trim() || strings.untitledNote,
        content: note.content, // Garder le contenu existant
        images: images.length > 0 ? images : undefined,
      });

      if (updatedNote) {
        console.log('✅ Note mise à jour avec succès');
        safeNavigate(`/(tabs)/note/${note.id}`);
      } else {
        console.error('❌ Erreur: Note non trouvée pour la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    showModal(
      <ImagePicker 
        onImageSelected={(imageBase64) => {
          console.log('📝 Image ajoutée à la note (édition), format:', imageBase64.substring(0, 30));
          setImages(prev => [...prev, imageBase64]);
        }}
        onClose={hideModal}
      />
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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
        title={strings.editNote}
        subtitle={note.title || strings.untitledNote}
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
          <Input
            label={strings.noteTitle}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Observations chantier, Mesures particulières..."
            error={errors.title}
          />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bouton fixe en bas du viewport */}
      <View style={styles.fixedFooter}>
        <Button
          title={loading ? "Sauvegarde..." : strings.saveChanges}
          onPress={handleSave}
          disabled={loading}
          style={styles.footerButton}
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
    paddingBottom: 140, // Espace augmenté pour le bouton fixe
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
  contentInputContainer: {
    flex: 1,
    minHeight: 300,
  },
  contentInput: {
    minHeight: 300,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
  },
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
  footerButton: {
    width: '100%',
  },
});