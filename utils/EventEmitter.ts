import { Platform } from 'react-native';

// Interface pour les écouteurs d'événements
interface EventListener {
  (...args: any[]): void;
}

// Interface pour les abonnements
interface Subscription {
  remove: () => void;
}

// Implémentation simple d'EventEmitter compatible avec toutes les plateformes
class SimpleEventEmitter {
  private listeners: Map<string, EventListener[]> = new Map();

  emit(eventName: string, data?: any): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.warn('Erreur dans l\'écouteur d\'événement:', error);
        }
      });
    }
  }

  addListener(eventName: string, listener: EventListener): Subscription {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    const eventListeners = this.listeners.get(eventName)!;
    eventListeners.push(listener);

    // Retourner un objet subscription avec une méthode remove
    return {
      remove: () => {
        const index = eventListeners.indexOf(listener);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
        
        // Nettoyer la map si plus d'écouteurs
        if (eventListeners.length === 0) {
          this.listeners.delete(eventName);
        }
      }
    };
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }
}

// Créer un émetteur d'événements global compatible avec toutes les plateformes
const globalEventEmitter = new SimpleEventEmitter();

// Fonction pour émettre un événement
export const emitEvent = (eventName: string, data?: any) => {
  try {
    globalEventEmitter.emit(eventName, data);
  } catch (error) {
    console.warn('Erreur lors de l\'émission d\'événement:', error);
  }
};

// Fonction pour ajouter un écouteur d'événement
export const addEventListener = (eventName: string, listener: EventListener) => {
  try {
    const subscription = globalEventEmitter.addListener(eventName, listener);
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      subscription.remove();
    };
  } catch (error) {
    console.warn('Erreur lors de l\'ajout d\'écouteur:', error);
    // Retourner une fonction vide en cas d'erreur
    return () => {};
  }
};

// Fonction spécifique pour déclencher l'ouverture du modal de création de projet
export const triggerCreateProjectModal = () => {
  try {
    emitEvent('openCreateProjectModal');
  } catch (error) {
    console.warn('Erreur lors du déclenchement du modal:', error);
  }
};

// Fonction pour nettoyer tous les écouteurs (utile pour les tests ou le nettoyage)
export const removeAllEventListeners = (eventName?: string) => {
  try {
    globalEventEmitter.removeAllListeners(eventName);
  } catch (error) {
    console.warn('Erreur lors du nettoyage des écouteurs:', error);
  }
};