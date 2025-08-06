import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Platform, Animated } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ImageViewerModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageViewerModal({ images, initialIndex, onClose }: ImageViewerModalProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoadStates, setImageLoadStates] = useState<Set<number>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    console.log('🖼️ ImageViewerModal - Images reçues:', images.length);
    console.log('🖼️ ImageViewerModal - Index initial:', initialIndex);
    images.forEach((img, idx) => {
      console.log(`🖼️ Image ${idx} format:`, img?.substring(0, 50));
    });
    
    // Animation d'ouverture
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    // Scroll vers l'image initiale
    if (scrollViewRef.current && initialIndex > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * screenWidth,
          animated: false
        });
      }, 100);
    }
  }, [fadeAnim, scaleAnim, initialIndex, screenWidth]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * screenWidth,
        animated: true
      });
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * screenWidth,
        animated: true
      });
    }
  };

  const handleClose = () => {
    // Animation de fermeture
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  const handleImageError = (index: number) => {
    console.error('❌ Erreur chargement lightbox image', index, 'URI:', images[index]?.substring(0, 50));
    setImageErrors(prev => new Set([...prev, index]));
  };

  const handleImageLoad = (index: number) => {
    console.log('✅ Image lightbox', index, 'chargée avec succès');
    setImageLoadStates(prev => new Set([...prev, index]));
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const styles = createStyles(theme);

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      {/* Header avec bouton fermer et compteur */}
      <View style={styles.header}>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Contenu principal avec l'image */}
      <Animated.View 
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {images.map((imageBase64, index) => (
            <View key={index} style={[styles.imageContainer, { width: screenWidth }]}>
              {!imageBase64 || imageBase64.trim() === '' ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Image vide</Text>
                  <Text style={styles.errorTextSmall}>Index: {index}</Text>
                </View>
              ) : imageErrors.has(index) ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Impossible de charger l'image</Text>
                  <Text style={styles.errorTextSmall}>Index: {index}</Text>
                  <Text style={styles.errorTextSmall}>URI: {imageBase64.substring(0, 30)}...</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: imageBase64 }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error(`❌ Erreur chargement lightbox image ${index}:`, error.nativeEvent?.error || error);
                    console.error(`❌ URI problématique lightbox:`, imageBase64.substring(0, 100));
                    handleImageError(index);
                  }}
                  onLoad={() => {
                    console.log(`✅ Image lightbox ${index} chargée - URI:`, imageBase64.substring(0, 50));
                    handleImageLoad(index);
                  }}
                />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Boutons de navigation (seulement si plusieurs images) */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity style={[styles.navButton, styles.navButtonLeft]} onPress={goToPrevious}>
                <ChevronLeft size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity style={[styles.navButton, styles.navButtonRight]} onPress={goToNext}>
                <ChevronRight size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </>
        )}
      </Animated.View>

      {/* Indicateurs de pagination (seulement si plusieurs images) */}
      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 2147483647,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  counter: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    maxWidth: Dimensions.get('window').width - 40,
    maxHeight: Dimensions.get('window').height - 200,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -30 }],
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  pagination: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 40 : 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    margin: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  errorTextSmall: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
});