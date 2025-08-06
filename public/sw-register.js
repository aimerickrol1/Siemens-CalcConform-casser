// Script d'enregistrement du Service Worker
// À inclure dans l'HTML principal

(function() {
  'use strict';

  // Vérifier si les Service Workers sont supportés
  if ('serviceWorker' in navigator) {
    console.log('🔧 Service Worker supporté');
    
    // Attendre que la page soit chargée
    window.addEventListener('load', () => {
      registerServiceWorker();
    });
  } else {
    console.warn('⚠️ Service Worker non supporté par ce navigateur');
  }

  async function registerServiceWorker() {
    try {
      console.log('📝 Enregistrement du Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker enregistré:', registration.scope);

      // Gestion des mises à jour
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Nouvelle version du Service Worker trouvée');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ Nouvelle version disponible');
              showUpdateNotification(registration);
            }
          });
        }
      });

      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          showUpdateNotification(registration);
        }
      });

      // Vérifier périodiquement les mises à jour
      setInterval(() => {
        registration.update();
      }, 60000); // Vérifier toutes les minutes

    } catch (error) {
      console.error('❌ Erreur enregistrement Service Worker:', error);
    }
  }

  function showUpdateNotification(registration) {
    // Créer une notification discrète de mise à jour
    const notification = document.createElement('div');
    notification.id = 'sw-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #009999;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">
          ✨ Mise à jour disponible
        </div>
        <div style="margin-bottom: 12px; opacity: 0.9;">
          Une nouvelle version de l'application est prête.
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="updateApp()" style="
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
          ">
            Mettre à jour
          </button>
          <button onclick="dismissUpdate()" style="
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
          ">
            Plus tard
          </button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // Fonctions globales pour les boutons
    window.updateApp = () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    };

    window.dismissUpdate = () => {
      const notif = document.getElementById('sw-update-notification');
      if (notif) {
        notif.remove();
      }
    };

    // Auto-dismiss après 10 secondes
    setTimeout(() => {
      const notif = document.getElementById('sw-update-notification');
      if (notif) {
        notif.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notif.remove(), 300);
      }
    }, 10000);
  }

  // Fonction utilitaire pour vérifier l'état de connexion
  window.checkOnlineStatus = () => {
    const isOnline = navigator.onLine;
    console.log('🌐 État connexion:', isOnline ? 'En ligne' : 'Hors ligne');
    return isOnline;
  };

  // Écouter les changements de connexion
  window.addEventListener('online', () => {
    console.log('✅ Connexion rétablie');
    // Optionnel : afficher une notification
  });

  window.addEventListener('offline', () => {
    console.log('📱 Mode hors ligne activé');
    // Optionnel : afficher une notification
  });

})();