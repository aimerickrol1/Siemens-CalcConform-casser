import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Camera, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { NoteImageGallery } from '@/components/NoteImageGallery';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function CreateNoteScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { createNote, notes } = useStorage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const validateForm = () => {
    const newErrors: { title?: string } = {};

    // Plus de validation obligatoire pour le titre
    // Un titre sera généré automatiquement si nécessaire

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    // Générer un titre automatique si aucun titre n'est fourni
    let finalTitle = title.trim();
    if (!finalTitle) {
      const existingTitles = notes.map(n => n.title).filter(t => t.startsWith('Note sans titre'));
      const nextNumber = existingTitles.length + 1;
      finalTitle = `Note sans titre ${nextNumber}`;
    }

    setLoading(true);
    try {
      console.log('📝 Création de la note:', finalTitle);
      console.log('📸 Nombre d\'images:', images.length);
      
      // Vérifier la taille totale des données avant création
      const totalDataSize = JSON.stringify({
        title: finalTitle,
        description: description.trim(),
        location: location.trim(),
        tags: tags.trim(),
        content: content.trim(),
        images: images
      }).length;
      
      console.log('💾 Taille totale des données:', totalDataSize, 'caractères');
      
      if (totalDataSize > 1000000) { // 1MB max
        Alert.alert('Erreur', 'La note est trop volumineuse. Réduisez le nombre d\'images ou leur qualité.');
        setLoading(false);
        return;
      }
      
      const note = await createNote({
        title: finalTitle,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        tags: tags.trim() || undefined,
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
      });

      if (note) {
        console.log('✅ Note créée avec succès:', note.id);
        safeNavigate(`/(tabs)/note/${note.id}`);
      } else {
        console.error('❌ Erreur: Note non créée');
        Alert.alert(strings.error, 'Impossible de créer la note. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la note:', error);
      Alert.alert(strings.error, 'Impossible de créer la note. Essayez de réduire le nombre d\'images.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priorityLevel: NotePriority) => {
    switch (priorityLevel) {
      case 'high': return '#FF4444';
      case 'medium': return '#FF8800';
      case 'low': return '#00AA44';
      default: return theme.colors.textTertiary;
    }
  };

  const getPriorityLabel = (priorityLevel: NotePriority) => {
    switch (priorityLevel) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Aucune';
    }
  };

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Réduire la taille pour éviter les problèmes de performance mobile
        const maxDimension = Math.max(img.width, img.height);
        const targetMaxDimension = Math.min(maxDimension, 800); // Réduit à 800px pour mobile
        
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

        // Convertir en base64 avec compression optimisée pour mobile
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // Réduit à 0.7 pour mobile
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
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert('Erreur', 'L\'image est trop volumineuse. Veuillez choisir une image de moins de 5MB.');
        target.value = '';
        return;
      }

      // Limiter le nombre d'images à 3 pour éviter les problèmes de performance
      if (images.length >= 3) {
        Alert.alert('Limite atteinte', 'Vous ne pouvez ajouter que 3 images maximum par note.');
        target.value = '';
        return;
      }

      try {
        console.log('📸 Image sélectionnée:', file.name, 'Taille:', file.size, 'Type:', file.type);
        
        // Compresser l'image pour le stockage
        const compressedImage = await compressImage(file);
        
        // Vérifier la taille de l'image compressée
        if (compressedImage.length > 500000) { // 500KB max en base64
          console.warn('⚠️ Image compressée encore trop volumineuse:', compressedImage.length);
          // Recompresser avec une qualité plus faible
          const recompressedImage = await compressImage(file, 600, 0.5);
          setImages(prev => [...prev, recompressedImage]);
        } else {
          setImages(prev => [...prev, compressedImage]);
        }
        // Réinitialiser l'input
        if (target) {
          target.value = '';
        }
      } catch (error) {
        console.error('Erreur lors du traitement de l\'image:', error);
        Alert.alert('Erreur', 'Impossible de traiter l\'image sélectionnée.');
        target.value = '';
      }
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Header
        title={strings.newNote}
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
            error={errors.title}
          />

          <Input
            label={strings.description}
            value={description}
            onChangeText={setDescription}
          />

          <Input
            label="Lieu"
            value={location}
            onChangeText={setLocation}
          />

          <Input
            label="Mots-clés"
            value={tags}
            onChangeText={setTags}
          />

          <NoteImageGallery 
            images={images}
            onRemoveImage={handleRemoveImage}
            editable={true}
          />

          <View style={styles.imageButtonContainer}>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleAddImage}
              disabled={images.length >= 3}
            >
              <Camera size={16} color={theme.colors.primary} />
              <Text style={styles.addPhotoText}>
                {images.length >= 3 ? 'Limite atteinte (3 max)' : 'Ajouter une photo'}
              </Text>
            </TouchableOpacity>
          </View>

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

      <View style={styles.fixedFooter}>
        <Button
          title={loading ? "Création..." : strings.createNote}
          onPress={handleCreate}
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