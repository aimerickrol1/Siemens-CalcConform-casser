# Siemens Smoke Extraction Calculator

Application de calcul de conformité de débit de désenfumage développée avec Expo et React Native.

## 🚀 Démarrage rapide

### Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd siemens-smoke-extraction-app

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## 📱 Build et déploiement

### Configuration EAS

1. Connectez-vous à EAS :
```bash
eas login
```

2. Configurez le projet :
```bash
eas build:configure
```

### Builds disponibles

#### Build APK (Android)
```bash
# Build APK de test
npm run build:android

# Build APK preview
npm run build:android-preview

# Build production (AAB)
npm run build:android-production
```

#### Build iOS
```bash
npm run build:ios
```

### Soumission aux stores

```bash
# Android Play Store
npm run submit:android

# iOS App Store
npm run submit:ios
```

## 🛠️ Développement

### Structure du projet

```
app/
├── _layout.tsx              # Layout racine
├── (tabs)/                  # Navigation par onglets
│   ├── _layout.tsx         # Configuration des onglets
│   ├── index.tsx           # Onglet Projets
│   ├── simple.tsx          # Onglet Calcul Rapide
│   ├── search.tsx          # Onglet Recherche
│   ├── export.tsx          # Onglet Export
│   └── about.tsx           # Onglet À propos
components/                  # Composants réutilisables
├── Button.tsx
├── Header.tsx
├── Input.tsx
└── ...
utils/                      # Utilitaires
├── storage.ts              # Gestion du stockage
├── compliance.ts           # Calculs de conformité
└── i18n.ts                # Internationalisation
```

### Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run android` - Ouvrir sur Android
- `npm run ios` - Ouvrir sur iOS
- `npm run web` - Ouvrir sur le web
- `npm run lint` - Vérifier le code
- `npm test` - Lancer les tests

## 🌍 Internationalisation

L'application supporte 4 langues :
- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais
- 🇪🇸 Espagnol
- 🇮🇹 Italien

## 📋 Fonctionnalités

- ✅ Gestion de projets de désenfumage
- ✅ Calcul de conformité selon NF S61-933
- ✅ Mode calcul rapide
- ✅ Recherche dans les volets
- ✅ Export CSV des données
- ✅ Interface multilingue
- ✅ Stockage local des données
- ✅ Mode hors ligne

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine :

```env
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_VERSION=2.0.0
```

### Personnalisation

- **Icônes** : Remplacez les fichiers dans `assets/images/`
- **Couleurs** : Modifiez les styles dans les composants
- **Traductions** : Éditez `utils/i18n.ts`

## 📄 Licence

© 2025 Siemens. Tous droits réservés.

## 👨‍💻 Développeur

Développé par Aimeric Krol - aimeric.krol@siemens.com