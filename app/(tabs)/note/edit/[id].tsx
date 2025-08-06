import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { NoteImageGallery } from '@/components/NoteImageGallery';
import { Note } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAndroidBackButton } from '@/utils/BackHandler';

export default function EditNoteScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { notes, updateNote } = useStorage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setDescription(foundNote.description || '');
        setLocation(foundNote.location || '');
        setTags(foundNote.tags || '');
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
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        tags: tags.trim() || undefined,
        content: content.trim(),
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
        const maxDimension = Math.max(img.width, img.height);
        const targetMaxDimension = Math.min(maxDimension, 1920);
        
        const ratio = targetMaxDimension / maxDimension;
        const newWidth = Math.round(img.width * ratio);
        const newHeight = Math.round(img.height * ratio);

        canvas.width = newWidth;
        canvas.height = newHeight;

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }

        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.92);
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
        
        const compressedBase64 = await compressImage(file);
        console.log('💾 Image compressée pour stockage, taille:', compressedBase64.length);
        
        setImages(prev => [...prev, compressedBase64]);
      } catch (error) {
        console.error('Erreur lors de la compression de l\'image:', error);
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          console.log('📄 Fallback Base64 créé:', base64.substring(0, 30));
          setImages(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    }
    
    target.value = '';
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
            placeholder="Titre de la note"
            error={errors.title}
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Description de la note"
          />

          <Input
            label="Lieu"
            value={location}
            onChangeText={setLocation}
            placeholder="Ex: Chantier Rivoli, Bureau, Site client"
          />

          <Input
            label="Mots-clés"
            value={tags}
            onChangeText={setTags}
            placeholder="Ex: urgent, mesures, problème, solution"
          />

          {/* Galerie d'images */}
          <NoteImageGallery 
            images={images}
            onRemoveImage={handleRemoveImage}
            editable={true}
            noteId={note.id}
          />

          {/* Bouton ajouter image */}
          <View style={styles.imageButtonContainer}>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleAddImage}
            >
              <Camera size={16} color={theme.colors.primary} />
              <Text style={styles.addPhotoText}>Ajouter une photo</Text>
            </TouchableOpacity>
          </View>

          {/* Contenu de la note */}
          <Text style={styles.contentLabel}>{strings.noteContent}</Text>
          <TextInput
            style={styles.contentTextInput}
            value={content}
            onChangeText={setContent}
            placeholder={strings.writeYourNote}
            placeholderTextColor={theme.colors.textTertiary}
            multiline={true}
            textAlignVertical="top"
            scrollEnabled={true}
            autoCorrect={true}
            spellCheck={true}
            returnKeyType="default"
            blurOnSubmit={false}
          />

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
  imageButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 36,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addPhotoText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
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
    minHeight: 200,
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