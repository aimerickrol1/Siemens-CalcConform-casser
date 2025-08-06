import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { Trash2, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';

interface NoteImageGalleryProps {
  images: string[];
  onRemoveImage: (index: number) => void;
  editable?: boolean;
  noteId?: string;
}

export function NoteImageGallery({ images, onRemoveImage, editable = false, noteId }: NoteImageGalleryProps) {
  const { theme } = useTheme();
  const { showModal, hideModal } = useModal();

  const handleRemoveImage = (index: number) => {
    if (!editable) return;

    showModal(
      <RemoveImageModal 
        onConfirm={() => {
          onRemoveImage(index);
          hideModal();
        }}
        onCancel={hideModal}
      />
    );
  };

  const handleImagePress = (index: number) => {
    try {
      // Encoder toutes les images pour les passer en paramètre
      const allImagesParam = encodeURIComponent(JSON.stringify(images));
      
      router.push({
        pathname: '/(tabs)/image-viewer',
        params: {
          imageUri: images[index],
          imageIndex: (index + 1).toString(),
          totalImages: images.length.toString(),
          allImages: allImagesParam,
          noteId: noteId || undefined
        }
      });
    } catch (error) {
      console.error('Erreur navigation vers visualiseur:', error);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Images ({images.length})</Text>
      <View style={styles.imageGrid}>
        {images.map((imageBase64, index) => (
          <NoteImageItem
            key={index}
            imageBase64={imageBase64}
            index={index}
            editable={editable}
            onPress={() => handleImagePress(index)}
            onRemove={() => handleRemoveImage(index)}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
}

// Composant séparé pour chaque image avec ses propres hooks  
function NoteImageItem({ imageBase64, index, editable, onPress, onRemove, theme }: {
  imageBase64: string;
  index: number;
  editable: boolean;
  onPress: () => void;
  onRemove: () => void;
  theme: any;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const styles = createStyles(theme);

  return (
    <View style={styles.imageContainer}>
      <TouchableOpacity
        style={styles.imageButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {imageError ? (
          <View style={styles.errorPlaceholder}>
            <Text style={styles.errorText}>❌</Text>
            <Text style={styles.errorTextSmall}>Erreur image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageBase64 }}
            style={styles.image}
            onLoad={() => {
              console.log(`✅ Image ${index} chargée avec succès dans miniature`);
              setImageLoaded(true);
            }}
            onError={(error) => {
              console.error(`❌ Erreur chargement miniature ${index}:`, error);
              setImageError(true);
            }}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
      {editable && (
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={onRemove}
        >
          <Trash2 size={14} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Modal de confirmation pour supprimer une image
function RemoveImageModal({ onConfirm, onCancel }: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Supprimer l'image</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.modalBody}>
        <Text style={styles.modalText}>
          Êtes-vous sûr de vouloir supprimer cette image ?
        </Text>
        <Text style={[styles.modalText, styles.modalBold]}>
          Cette action est irréversible.
        </Text>
      </View>

      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={onCancel}
        >
          <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
            Annuler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
          onPress={onConfirm}
        >
          <Text style={[styles.modalButtonText, { color: 'white' }]}>
            Supprimer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
  },
  imageContainer: {
    width: '30%', // Trois images par ligne pour plus de compacité
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imageButton: {
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 60, // Encore plus petit pour l'affichage horizontal
    borderRadius: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  errorPlaceholder: {
    width: '100%',
    height: 60,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorText: {
    fontSize: 24,
    marginBottom: 4,
  },
  errorTextSmall: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textTertiary,
  },
  // Styles pour le modal
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
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
    marginBottom: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});