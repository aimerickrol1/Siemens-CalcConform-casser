import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';

interface ModalContextType {
  showModal: (content: ReactNode, options?: ModalOptions) => void;
  hideModal: () => void;
  isVisible: boolean;
}

interface ModalOptions {
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  onRequestClose?: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

// Composant Portal pour web qui rend directement dans le DOM
function WebPortal({ children, isVisible }: { children: ReactNode; isVisible: boolean }) {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Créer un élément portal complètement séparé et l'ajouter directement au body
    const portalDiv = document.createElement('div');
    portalDiv.id = `modal-portal-${Date.now()}`;
    portalDiv.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 2147483647 !important;
      pointer-events: ${isVisible ? 'auto' : 'none'} !important;
      opacity: ${isVisible ? '1' : '0'} !important;
      transition: opacity 0.3s ease !important;
      background-color: ${isVisible ? 'rgba(0, 0, 0, 0.5)' : 'transparent'} !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
      isolation: isolate !important;
      contain: layout style paint !important;
    `;

    // Ajouter directement au body en tant que dernier enfant
    document.body.appendChild(portalDiv);
    setPortalElement(portalDiv);

    // Empêcher le scroll du body quand la modale est ouverte
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    return () => {
      // Restaurer le scroll du body
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      // Supprimer l'élément portal
      if (document.body.contains(portalDiv)) {
        document.body.removeChild(portalDiv);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !portalElement) return;

    // Mettre à jour les styles quand la visibilité change
    portalElement.style.pointerEvents = isVisible ? 'auto' : 'none';
    portalElement.style.opacity = isVisible ? '1' : '0';
    portalElement.style.backgroundColor = isVisible ? 'rgba(0, 0, 0, 0.5)' : 'transparent';
    portalElement.style.zIndex = '2147483647';

    // Gérer le scroll du body
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }, [isVisible, portalElement]);

  // Rendre le contenu dans le portal sur web
  if (Platform.OS === 'web' && portalElement && isVisible) {
    // Utiliser createPortal de react-dom pour web
    try {
      const ReactDOM = require('react-dom');
      return ReactDOM.createPortal(children, portalElement);
    } catch (error) {
      console.warn('ReactDOM non disponible, fallback vers rendu normal');
      return null;
    }
  }

  return null;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({});
  const [isVisible, setIsVisible] = useState(false);

  const showModal = (content: ReactNode, options: ModalOptions = {}) => {
    setModalContent(content);
    setModalOptions({
      animationType: 'fade',
      transparent: true,
      ...options
    });
    setIsVisible(true);
  };

  const hideModal = () => {
    setIsVisible(false);
    // Délai pour permettre l'animation de fermeture
    setTimeout(() => {
      setModalContent(null);
      setModalOptions({});
    }, 300);
  };

  const handleRequestClose = () => {
    if (modalOptions.onRequestClose) {
      modalOptions.onRequestClose();
    } else {
      hideModal();
    }
  };

  // Gestionnaire de clic sur le backdrop
  const handleBackdropClick = (e: any) => {
    // Vérifier si le clic est sur le backdrop et non sur le contenu de la modale
    if (e.target === e.currentTarget) {
      handleRequestClose();
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, isVisible }}>
      {children}
      
      {/* Portal pour web */}
      {Platform.OS === 'web' && (
        <WebPortal isVisible={isVisible}>
          {modalContent && (
            <div 
              onClick={handleBackdropClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                padding: '20px',
                boxSizing: 'border-box'
              }}
            >
              {modalContent}
            </div>
          )}
        </WebPortal>
      )}

      {/* Modal native pour mobile */}
      {Platform.OS !== 'web' && (
        <Modal
          animationType={modalOptions.animationType || 'fade'}
          transparent={modalOptions.transparent !== false}
          visible={isVisible}
          onRequestClose={handleRequestClose}
          statusBarTranslucent={true}
        >
          <View style={nativeModalStyles.overlay}>
            <TouchableOpacity 
              style={nativeModalStyles.backdrop}
              activeOpacity={1}
              onPress={handleRequestClose}
            >
              <View style={nativeModalStyles.content}>
                {modalContent}
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Styles pour les modales natives (mobile)
const nativeModalStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
  }
};

// Import conditionnel pour éviter les erreurs
let Modal: any = null;
let View: any = null;
let TouchableOpacity: any = null;

try {
  const RN = require('react-native');
  Modal = RN.Modal;
  View = RN.View;
  TouchableOpacity = RN.TouchableOpacity;
} catch (error) {
  // Pas de react-native disponible
}