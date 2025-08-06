// Système d'internationalisation pour l'application Siemens CalcConform

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'it';

export interface LanguageStrings {
  // Navigation et onglets
  projects: string;
  quickCalc: string;
  search: string;
  export: string;
  about: string;
  settings: string;
  notes: string;

  // Titres et sous-titres
  projectsTitle: string;
  projectsSubtitle: string;
  quickCalcTitle: string;
  quickCalcSubtitle: string;
  searchTitle: string;
  searchSubtitle: string;
  exportTitle: string;
  exportSubtitle: string;
  aboutTitle: string;
  aboutSubtitle: string;
  notesTitle: string;
  notesSubtitle: string;
  settingsTitle: string;
  settingsSubtitle: string;

  // Actions générales
  create: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  ok: string;
  yes: string;
  no: string;
  back: string;
  next: string;
  previous: string;
  close: string;
  open: string;
  loading: string;
  error: string;
  success: string;
  warning: string;
  info: string;

  // Projets
  project: string;
  newProject: string;
  editProject: string;
  deleteProject: string;
  createProject: string;
  projectName: string;
  projectDescription: string;
  noProjects: string;
  noProjectsDesc: string;
  createFirstProject: string;

  // Bâtiments
  building: string;
  buildings: string;
  newBuilding: string;
  editBuilding: string;
  deleteBuilding: string;
  createBuilding: string;
  buildingName: string;
  buildingDescription: string;
  noBuildings: string;
  noBuildingsDesc: string;

  // Zones
  zone: string;
  zones: string;
  newZone: string;
  editZone: string;
  deleteZone: string;
  createZone: string;
  zoneName: string;
  zoneDescription: string;
  noZones: string;
  noZonesDesc: string;
  smokeExtractionZone: string;

  // Volets
  shutter: string;
  shutters: string;
  newShutter: string;
  editShutter: string;
  deleteShutter: string;
  deleteShutterConfirm: string;
  createShutter: string;
  addFirstShutter: string;
  shutterName: string;
  shutterType: string;
  shutterHigh: string;
  shutterLow: string;
  noShutters: string;
  noShuttersDesc: string;

  // Débits et mesures
  referenceFlow: string;
  measuredFlow: string;
  flowMeasurements: string;
  cubicMeterPerHour: string;
  deviation: string;
  calculatedDeviation: string;

  // Conformité
  compliance: string;
  complianceResult: string;
  compliancePreview: string;
  complianceCalculations: string;
  compliant: string;
  acceptable: string;
  nonCompliant: string;
  functionalDesc: string;
  acceptableDesc: string;
  nonCompliantDesc: string;
  invalidReference: string;

  // Formulaires
  nameRequired: string;
  positiveOrZeroRequired: string;
  invalidDate: string;
  endDateAfterStart: string;
  optional: string;
  required: string;

  // Dates
  startDate: string;
  endDate: string;
  createdOn: string;
  updatedOn: string;
  city: string;

  // Remarques
  remarks: string;

  // Description
  description: string;

  // Recherche
  simpleSearch: string;
  hierarchicalSearch: string;
  searchScope: string;
  searchInSelected: string;
  searchMinChars: string;
  searchResults: string;
  noResults: string;
  noResultsDesc: string;
  searching: string;

  // Export
  exportMyData: string;
  noProjectsToExport: string;
  noProjectsToExportDesc: string;
  availableProjects: string;

  // Calcul rapide
  complianceCalculator: string;
  clearValues: string;
  simplifiedModeDesc: string;

  // Norme
  nfStandardDesc: string;

  // Interface
  generalInfo: string;
  version: string;
  currentVersion: string;
  appUpToDate: string;
  loadingData: string;
  dataNotFound: string;
  itemNotFound: string;
  saveChanges: string;

  // Favoris et sélection
  favorites: string;
  selected: string;
  copied: string;

  // À propos
  appDescription: string;
  developedBy: string;
  copyright: string;
  application: string;
  languageAndRegion: string;
  interfaceLanguage: string;
  dataManagement: string;
  storageUsed: string;
  clearAllData: string;
  clearAllDataDesc: string;
  clearAllDataConfirm: string;
  clearAllDataWarning: string;
  dataCleared: string;
  dataClearedDesc: string;
  applicationSection: string;
  contactDeveloper: string;
  contact: string;
  contactDeveloperMessage: string;
  consultDocument: string;
  pdfOpenError: string;

  // Confidentialité
  privacy: string;
  privacyTitle: string;
  dataProtection: string;
  dataProtectionTitle: string;
  dataProtectionDesc: string;
  localStorageTitle: string;
  localStorageDesc: string;
  unofficialApp: string;
  unofficialAppDesc: string;
  understood: string;

  // Langues
  selectLanguage: string;
  approximateTranslations: string;
  translationNote: string;

  // Notes
  note: string;
  newNote: string;
  editNote: string;
  deleteNote: string;
  createNote: string;
  noteTitle: string;
  noteContent: string;
  noNotes: string;
  noNotesDesc: string;
  createFirstNote: string;
  writeYourNote: string;
  noteCreated: string;
  noteUpdated: string;
  noteDeleted: string;
  deleteNoteConfirm: string;
  untitledNote: string;
}

const strings: Record<SupportedLanguage, LanguageStrings> = {
  fr: {
    // Navigation et onglets
    projects: 'Projets',
    quickCalc: 'Calcul rapide',
    search: 'Recherche',
    export: 'Export',
    about: 'À propos',
    settings: 'Paramètres',
    notes: 'Notes',

    // Titres et sous-titres
    projectsTitle: 'Projets',
    projectsSubtitle: 'Gestion des projets de désenfumage',
    quickCalcTitle: 'Calcul rapide',
    quickCalcSubtitle: 'Calcul de conformité simplifié',
    searchTitle: 'Recherche',
    searchSubtitle: 'Rechercher dans vos volets',
    exportTitle: 'Export',
    exportSubtitle: 'Exporter vos données',
    aboutTitle: 'À propos',
    aboutSubtitle: 'Informations sur l\'application',
    notesTitle: 'Bloc-notes',
    notesSubtitle: 'Vos notes et observations',
    settingsTitle: 'Paramètres',
    settingsSubtitle: 'Configuration de l\'application',

    // Actions générales
    create: 'Créer',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    ok: 'OK',
    yes: 'Oui',
    no: 'Non',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    close: 'Fermer',
    open: 'Ouvrir',
    loading: 'Chargement',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Attention',
    info: 'Information',

    // Projets
    project: 'Projet',
    newProject: 'Nouveau projet',
    editProject: 'Modifier le projet',
    deleteProject: 'Supprimer le projet',
    createProject: 'Créer le projet',
    projectName: 'Nom du projet',
    projectDescription: 'Description du projet',
    noProjects: 'Aucun projet',
    noProjectsDesc: 'Créez votre premier projet pour commencer',
    createFirstProject: 'Créer votre premier projet',

    // Bâtiments
    building: 'Bâtiment',
    buildings: 'Bâtiments',
    newBuilding: 'Nouveau bâtiment',
    editBuilding: 'Modifier le bâtiment',
    deleteBuilding: 'Supprimer le bâtiment',
    createBuilding: 'Créer le bâtiment',
    buildingName: 'Nom du bâtiment',
    buildingDescription: 'Description du bâtiment',
    noBuildings: 'Aucun bâtiment',
    noBuildingsDesc: 'Ajoutez des bâtiments à votre projet',

    // Zones
    zone: 'Zone',
    zones: 'Zones',
    newZone: 'Nouvelle zone',
    editZone: 'Modifier la zone',
    deleteZone: 'Supprimer la zone',
    createZone: 'Créer la zone',
    zoneName: 'Nom de la zone',
    zoneDescription: 'Description de la zone',
    noZones: 'Aucune zone',
    noZonesDesc: 'Ajoutez des zones de désenfumage à ce bâtiment',
    smokeExtractionZone: 'Zone de désenfumage',

    // Volets
    shutter: 'Volet',
    shutters: 'Volets',
    newShutter: 'Nouveau volet',
    editShutter: 'Modifier le volet',
    deleteShutter: 'Supprimer le volet',
    deleteShutterConfirm: 'Êtes-vous sûr de vouloir supprimer le volet',
    createShutter: 'Créer le volet',
    addFirstShutter: 'Ajouter le premier volet',
    shutterName: 'Nom du volet',
    shutterType: 'Type de volet',
    shutterHigh: 'Volet Haut (VH)',
    shutterLow: 'Volet Bas (VB)',
    noShutters: 'Aucun volet',
    noShuttersDesc: 'Ajoutez des volets à cette zone',

    // Débits et mesures
    referenceFlow: 'Débit de référence',
    measuredFlow: 'Débit mesuré',
    flowMeasurements: 'Mesures de débit',
    cubicMeterPerHour: 'm³/h',
    deviation: 'Écart',
    calculatedDeviation: 'Écart calculé',

    // Conformité
    compliance: 'Conformité',
    complianceResult: 'Résultat de conformité',
    compliancePreview: 'Aperçu de conformité',
    complianceCalculations: 'Calculs de conformité',
    compliant: 'Fonctionnel',
    acceptable: 'Acceptable',
    nonCompliant: 'Non conforme',
    functionalDesc: 'Un écart inférieur à 10% entre les valeurs retenues lors de cet essai fonctionnel et les valeurs de référence conduit au constat du fonctionnement attendu du système de désenfumage mécanique.',
    acceptableDesc: 'Un écart compris entre 10% et 20% entre les valeurs retenues lors de cet essai fonctionnel et les valeurs de référence conduit à signaler cette dérive, par une proposition d\'action corrective à l\'exploitant ou au chef d\'établissement.',
    nonCompliantDesc: 'Un écart supérieur à 20% entre les valeurs retenues lors de cet essai fonctionnel et les valeurs de référence retenues à la mise en service, doit conduire à une action corrective.',
    invalidReference: 'Référence invalide',

    // Formulaires
    nameRequired: 'Le nom est requis',
    positiveOrZeroRequired: 'Valeur positive ou zéro requise',
    invalidDate: 'Format de date invalide (JJ/MM/AAAA)',
    endDateAfterStart: 'La date de fin doit être après la date de début',
    optional: 'optionnel',
    required: 'requis',

    // Dates
    startDate: 'Date de début',
    endDate: 'Date de fin',
    createdOn: 'Créé le',
    updatedOn: 'Modifié le',
    city: 'Ville',

    // Remarques
    remarks: 'Remarques',

    // Description
    description: 'Description',

    // Recherche
    simpleSearch: 'Recherche simple',
    hierarchicalSearch: 'Recherche hiérarchique',
    searchScope: 'Portée de recherche',
    searchInSelected: 'Rechercher dans la sélection',
    searchMinChars: 'Saisissez au moins 2 caractères pour rechercher',
    searchResults: 'résultats',
    noResults: 'Aucun résultat',
    noResultsDesc: 'Aucun volet ne correspond à votre recherche',
    searching: 'Recherche en cours...',

    // Export
    exportMyData: 'Exporter mes données',
    noProjectsToExport: 'Aucun projet à exporter',
    noProjectsToExportDesc: 'Créez des projets pour pouvoir les exporter',
    availableProjects: 'Projets disponibles',

    // Calcul rapide
    complianceCalculator: 'Calculateur de conformité',
    clearValues: 'Effacer les valeurs',
    simplifiedModeDesc: 'Saisissez les débits pour calculer la conformité',

    // Norme
    nfStandardDesc: 'Calculs selon la norme NF S61-933 Annexe H',

    // Interface
    generalInfo: 'Informations générales',
    version: 'Version',
    currentVersion: 'Version actuelle',
    appUpToDate: 'Application à jour',
    loadingData: 'Chargement des données...',
    dataNotFound: 'Données non trouvées',
    itemNotFound: 'Élément non trouvé',
    saveChanges: 'Enregistrer les modifications',

    // Favoris et sélection
    favorites: 'Favoris',
    selected: 'sélectionné',
    copied: 'copié',

    // À propos
    appDescription: 'Application de calcul de conformité de débit de désenfumage',
    developedBy: 'Développé par Aimeric Krol',
    copyright: '© 2025 Siemens. Tous droits réservés.',
    application: 'Application',
    languageAndRegion: 'Langue et région',
    interfaceLanguage: 'Langue de l\'interface',
    dataManagement: 'Gestion des données',
    storageUsed: 'Stockage utilisé',
    clearAllData: 'Effacer toutes les données',
    clearAllDataDesc: 'Supprimer tous les projets et données',
    clearAllDataConfirm: 'Confirmer la suppression',
    clearAllDataWarning: 'Cette action est irréversible !',
    dataCleared: 'Données supprimées',
    dataClearedDesc: 'Toutes vos données ont été supprimées',
    applicationSection: 'Application',
    contactDeveloper: 'Contacter le développeur',
    contact: 'Contact',
    contactDeveloperMessage: 'Pour toute question ou suggestion, contactez aimeric.krol@siemens.com',
    consultDocument: 'Consulter le document',
    pdfOpenError: 'Impossible d\'ouvrir le document PDF',

    // Confidentialité
    privacy: 'Confidentialité',
    privacyTitle: 'Politique de confidentialité',
    dataProtection: 'Protection des données',
    dataProtectionTitle: 'Protection des données',
    dataProtectionDesc: 'Vos données sont stockées localement sur votre appareil et ne sont jamais transmises à des serveurs externes.',
    localStorageTitle: 'Stockage local',
    localStorageDesc: 'Toutes vos données (projets, bâtiments, zones, volets) sont sauvegardées uniquement sur votre appareil.',
    unofficialApp: 'Application non officielle',
    unofficialAppDesc: 'Cette application n\'est pas officiellement approuvée par les organismes de normalisation.',
    understood: 'Compris',

    // Langues
    selectLanguage: 'Sélectionner la langue',
    approximateTranslations: 'Traductions approximatives',
    translationNote: 'Les traductions dans d\'autres langues sont approximatives et peuvent contenir des erreurs.',

    // Notes
    note: 'Note',
    newNote: 'Nouvelle note',
    editNote: 'Modifier la note',
    deleteNote: 'Supprimer la note',
    createNote: 'Créer la note',
    noteTitle: 'Titre de la note',
    noteContent: 'Contenu de la note',
    noNotes: 'Aucune note',
    noNotesDesc: 'Créez votre première note pour commencer',
    createFirstNote: 'Créer votre première note',
    writeYourNote: 'Écrivez votre note ici...',
    noteCreated: 'Note créée',
    noteUpdated: 'Note mise à jour',
    noteDeleted: 'Note supprimée',
    deleteNoteConfirm: 'Êtes-vous sûr de vouloir supprimer cette note',
    untitledNote: 'Note sans titre',
  },

  en: {
    // Navigation et onglets
    projects: 'Projects',
    quickCalc: 'Quick Calc',
    search: 'Search',
    export: 'Export',
    about: 'About',
    settings: 'Settings',
    notes: 'Notes',

    // Titres et sous-titres
    projectsTitle: 'Projects',
    projectsSubtitle: 'Smoke extraction project management',
    quickCalcTitle: 'Quick Calc',
    quickCalcSubtitle: 'Simplified compliance calculation',
    searchTitle: 'Search',
    searchSubtitle: 'Search in your shutters',
    exportTitle: 'Export',
    exportSubtitle: 'Export your data',
    aboutTitle: 'About',
    aboutSubtitle: 'Application information',
    notesTitle: 'Notepad',
    notesSubtitle: 'Your notes and observations',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Application configuration',

    // Actions générales
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    open: 'Open',
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',

    // Projets
    project: 'Project',
    newProject: 'New project',
    editProject: 'Edit project',
    deleteProject: 'Delete project',
    createProject: 'Create project',
    projectName: 'Project name',
    projectDescription: 'Project description',
    noProjects: 'No projects',
    noProjectsDesc: 'Create your first project to get started',
    createFirstProject: 'Create your first project',

    // Bâtiments
    building: 'Building',
    buildings: 'Buildings',
    newBuilding: 'New building',
    editBuilding: 'Edit building',
    deleteBuilding: 'Delete building',
    createBuilding: 'Create building',
    buildingName: 'Building name',
    buildingDescription: 'Building description',
    noBuildings: 'No buildings',
    noBuildingsDesc: 'Add buildings to your project',

    // Zones
    zone: 'Zone',
    zones: 'Zones',
    newZone: 'New zone',
    editZone: 'Edit zone',
    deleteZone: 'Delete zone',
    createZone: 'Create zone',
    zoneName: 'Zone name',
    zoneDescription: 'Zone description',
    noZones: 'No zones',
    noZonesDesc: 'Add smoke extraction zones to this building',
    smokeExtractionZone: 'Smoke extraction zone',

    // Volets
    shutter: 'Shutter',
    shutters: 'Shutters',
    newShutter: 'New shutter',
    editShutter: 'Edit shutter',
    deleteShutter: 'Delete shutter',
    deleteShutterConfirm: 'Are you sure you want to delete the shutter',
    createShutter: 'Create shutter',
    addFirstShutter: 'Add first shutter',
    shutterName: 'Shutter name',
    shutterType: 'Shutter type',
    shutterHigh: 'High Shutter (HS)',
    shutterLow: 'Low Shutter (LS)',
    noShutters: 'No shutters',
    noShuttersDesc: 'Add shutters to this zone',

    // Débits et mesures
    referenceFlow: 'Reference flow',
    measuredFlow: 'Measured flow',
    flowMeasurements: 'Flow measurements',
    cubicMeterPerHour: 'm³/h',
    deviation: 'Deviation',
    calculatedDeviation: 'Calculated deviation',

    // Conformité
    compliance: 'Compliance',
    complianceResult: 'Compliance result',
    compliancePreview: 'Compliance preview',
    complianceCalculations: 'Compliance calculations',
    compliant: 'Compliant',
    acceptable: 'Acceptable',
    nonCompliant: 'Non-compliant',
    functionalDesc: 'A deviation of less than 10% between the values recorded during this functional test and the reference values leads to the observation of the expected operation of the mechanical smoke extraction system.',
    acceptableDesc: 'A deviation between 10% and 20% between the values recorded during this functional test and the reference values leads to reporting this drift, through a proposal for corrective action to the operator or the establishment manager.',
    nonCompliantDesc: 'A deviation greater than 20% between the values recorded during this functional test and the reference values retained at commissioning must lead to corrective action.',
    invalidReference: 'Invalid reference',

    // Formulaires
    nameRequired: 'Name is required',
    positiveOrZeroRequired: 'Positive or zero value required',
    invalidDate: 'Invalid date format (DD/MM/YYYY)',
    endDateAfterStart: 'End date must be after start date',
    optional: 'optional',
    required: 'required',

    // Dates
    startDate: 'Start date',
    endDate: 'End date',
    createdOn: 'Created on',
    updatedOn: 'Updated on',
    city: 'City',

    // Remarques
    remarks: 'Remarks',

    // Description
    description: 'Description',

    // Recherche
    simpleSearch: 'Simple search',
    hierarchicalSearch: 'Hierarchical search',
    searchScope: 'Search scope',
    searchInSelected: 'Search in selection',
    searchMinChars: 'Enter at least 2 characters to search',
    searchResults: 'results',
    noResults: 'No results',
    noResultsDesc: 'No shutters match your search',
    searching: 'Searching...',

    // Export
    exportMyData: 'Export my data',
    noProjectsToExport: 'No projects to export',
    noProjectsToExportDesc: 'Create projects to be able to export them',
    availableProjects: 'Available projects',

    // Calcul rapide
    complianceCalculator: 'Compliance calculator',
    clearValues: 'Clear values',
    simplifiedModeDesc: 'Enter flow rates to calculate compliance',

    // Norme
    nfStandardDesc: 'Calculations according to NF S61-933 Annex H standard',

    // Interface
    generalInfo: 'General information',
    version: 'Version',
    currentVersion: 'Current version',
    appUpToDate: 'App up to date',
    loadingData: 'Loading data...',
    dataNotFound: 'Data not found',
    itemNotFound: 'Item not found',
    saveChanges: 'Save changes',

    // Favoris et sélection
    favorites: 'Favorites',
    selected: 'selected',
    copied: 'copied',

    // À propos
    appDescription: 'Smoke extraction flow compliance calculation application',
    developedBy: 'Developed by Aimeric Krol',
    copyright: '© 2025 Siemens. All rights reserved.',
    application: 'Application',
    languageAndRegion: 'Language and region',
    interfaceLanguage: 'Interface language',
    dataManagement: 'Data management',
    storageUsed: 'Storage used',
    clearAllData: 'Clear all data',
    clearAllDataDesc: 'Delete all projects and data',
    clearAllDataConfirm: 'Confirm deletion',
    clearAllDataWarning: 'This action is irreversible!',
    dataCleared: 'Data cleared',
    dataClearedDesc: 'All your data has been deleted',
    applicationSection: 'Application',
    contactDeveloper: 'Contact developer',
    contact: 'Contact',
    contactDeveloperMessage: 'For any questions or suggestions, contact aimeric.krol@siemens.com',
    consultDocument: 'View document',
    pdfOpenError: 'Unable to open PDF document',

    // Confidentialité
    privacy: 'Privacy',
    privacyTitle: 'Privacy policy',
    dataProtection: 'Data protection',
    dataProtectionTitle: 'Data protection',
    dataProtectionDesc: 'Your data is stored locally on your device and is never transmitted to external servers.',
    localStorageTitle: 'Local storage',
    localStorageDesc: 'All your data (projects, buildings, zones, shutters) is saved only on your device.',
    unofficialApp: 'Unofficial application',
    unofficialAppDesc: 'This application is not officially approved by standardization bodies.',
    understood: 'Understood',

    // Langues
    selectLanguage: 'Select language',
    approximateTranslations: 'Approximate translations',
    translationNote: 'Translations in other languages are approximate and may contain errors.',

    // Notes
    note: 'Note',
    newNote: 'New note',
    editNote: 'Edit note',
    deleteNote: 'Delete note',
    createNote: 'Create note',
    noteTitle: 'Note title',
    noteContent: 'Note content',
    noNotes: 'No notes',
    noNotesDesc: 'Create your first note to get started',
    createFirstNote: 'Create your first note',
    writeYourNote: 'Write your note here...',
    noteCreated: 'Note created',
    noteUpdated: 'Note updated',
    noteDeleted: 'Note deleted',
    deleteNoteConfirm: 'Are you sure you want to delete this note',
    untitledNote: 'Untitled note',
  },

  es: {
    // Navigation et onglets
    projects: 'Proyectos',
    quickCalc: 'Cálculo rápido',
    search: 'Búsqueda',
    export: 'Exportar',
    about: 'Acerca de',
    settings: 'Configuración',
    notes: 'Notas',

    // Titres et sous-titres
    projectsTitle: 'Proyectos',
    projectsSubtitle: 'Gestión de proyectos de extracción de humos',
    quickCalcTitle: 'Cálculo rápido',
    quickCalcSubtitle: 'Cálculo de cumplimiento simplificado',
    searchTitle: 'Búsqueda',
    searchSubtitle: 'Buscar en sus compuertas',
    exportTitle: 'Exportar',
    exportSubtitle: 'Exportar sus datos',
    aboutTitle: 'Acerca de',
    aboutSubtitle: 'Información de la aplicación',
    notesTitle: 'Bloc de notas',
    notesSubtitle: 'Sus notas y observaciones',
    settingsTitle: 'Configuración',
    settingsSubtitle: 'Configuración de la aplicación',

    // Actions générales
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    ok: 'OK',
    yes: 'Sí',
    no: 'No',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    close: 'Cerrar',
    open: 'Abrir',
    loading: 'Cargando',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',

    // Projets
    project: 'Proyecto',
    newProject: 'Nuevo proyecto',
    editProject: 'Editar proyecto',
    deleteProject: 'Eliminar proyecto',
    createProject: 'Crear proyecto',
    projectName: 'Nombre del proyecto',
    projectDescription: 'Descripción del proyecto',
    noProjects: 'Sin proyectos',
    noProjectsDesc: 'Cree su primer proyecto para comenzar',
    createFirstProject: 'Crear su primer proyecto',

    // Bâtiments
    building: 'Edificio',
    buildings: 'Edificios',
    newBuilding: 'Nuevo edificio',
    editBuilding: 'Editar edificio',
    deleteBuilding: 'Eliminar edificio',
    createBuilding: 'Crear edificio',
    buildingName: 'Nombre del edificio',
    buildingDescription: 'Descripción del edificio',
    noBuildings: 'Sin edificios',
    noBuildingsDesc: 'Agregue edificios a su proyecto',

    // Zones
    zone: 'Zona',
    zones: 'Zonas',
    newZone: 'Nueva zona',
    editZone: 'Editar zona',
    deleteZone: 'Eliminar zona',
    createZone: 'Crear zona',
    zoneName: 'Nombre de la zona',
    zoneDescription: 'Descripción de la zona',
    noZones: 'Sin zonas',
    noZonesDesc: 'Agregue zonas de extracción de humos a este edificio',
    smokeExtractionZone: 'Zona de extracción de humos',

    // Volets
    shutter: 'Compuerta',
    shutters: 'Compuertas',
    newShutter: 'Nueva compuerta',
    editShutter: 'Editar compuerta',
    deleteShutter: 'Eliminar compuerta',
    deleteShutterConfirm: '¿Está seguro de que desea eliminar la compuerta',
    createShutter: 'Crear compuerta',
    addFirstShutter: 'Agregar primera compuerta',
    shutterName: 'Nombre de la compuerta',
    shutterType: 'Tipo de compuerta',
    shutterHigh: 'Compuerta Alta (CA)',
    shutterLow: 'Compuerta Baja (CB)',
    noShutters: 'Sin compuertas',
    noShuttersDesc: 'Agregue compuertas a esta zona',

    // Débits et mesures
    referenceFlow: 'Caudal de referencia',
    measuredFlow: 'Caudal medido',
    flowMeasurements: 'Mediciones de caudal',
    cubicMeterPerHour: 'm³/h',
    deviation: 'Desviación',
    calculatedDeviation: 'Desviación calculada',

    // Conformité
    compliance: 'Cumplimiento',
    complianceResult: 'Resultado de cumplimiento',
    compliancePreview: 'Vista previa de cumplimiento',
    complianceCalculations: 'Cálculos de cumplimiento',
    compliant: 'Conforme',
    acceptable: 'Aceptable',
    nonCompliant: 'No conforme',
    functionalDesc: 'Una desviación inferior al 10% entre los valores registrados durante esta prueba funcional y los valores de referencia conduce a la constatación del funcionamiento esperado del sistema de extracción mecánica de humos.',
    acceptableDesc: 'Una desviación entre el 10% y el 20% entre los valores registrados durante esta prueba funcional y los valores de referencia conduce a señalar esta deriva, mediante una propuesta de acción correctiva al operador o al responsable del establecimiento.',
    nonCompliantDesc: 'Una desviación superior al 20% entre los valores registrados durante esta prueba funcional y los valores de referencia retenidos en la puesta en servicio debe conducir a una acción correctiva.',
    invalidReference: 'Referencia inválida',

    // Formulaires
    nameRequired: 'El nombre es requerido',
    positiveOrZeroRequired: 'Se requiere valor positivo o cero',
    invalidDate: 'Formato de fecha inválido (DD/MM/AAAA)',
    endDateAfterStart: 'La fecha de fin debe ser posterior a la fecha de inicio',
    optional: 'opcional',
    required: 'requerido',

    // Dates
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de fin',
    createdOn: 'Creado el',
    updatedOn: 'Actualizado el',
    city: 'Ciudad',

    // Remarques
    remarks: 'Observaciones',

    // Description
    description: 'Descripción',

    // Recherche
    simpleSearch: 'Búsqueda simple',
    hierarchicalSearch: 'Búsqueda jerárquica',
    searchScope: 'Alcance de búsqueda',
    searchInSelected: 'Buscar en selección',
    searchMinChars: 'Ingrese al menos 2 caracteres para buscar',
    searchResults: 'resultados',
    noResults: 'Sin resultados',
    noResultsDesc: 'Ninguna compuerta coincide con su búsqueda',
    searching: 'Buscando...',

    // Export
    exportMyData: 'Exportar mis datos',
    noProjectsToExport: 'Sin proyectos para exportar',
    noProjectsToExportDesc: 'Cree proyectos para poder exportarlos',
    availableProjects: 'Proyectos disponibles',

    // Calcul rapide
    complianceCalculator: 'Calculadora de cumplimiento',
    clearValues: 'Limpiar valores',
    simplifiedModeDesc: 'Ingrese los caudales para calcular el cumplimiento',

    // Norme
    nfStandardDesc: 'Cálculos según la norma NF S61-933 Anexo H',

    // Interface
    generalInfo: 'Información general',
    version: 'Versión',
    currentVersion: 'Versión actual',
    appUpToDate: 'Aplicación actualizada',
    loadingData: 'Cargando datos...',
    dataNotFound: 'Datos no encontrados',
    itemNotFound: 'Elemento no encontrado',
    saveChanges: 'Guardar cambios',

    // Favoris et sélection
    favorites: 'Favoritos',
    selected: 'seleccionado',
    copied: 'copiado',

    // À propos
    appDescription: 'Aplicación de cálculo de cumplimiento de flujo de extracción de humos',
    developedBy: 'Desarrollado por Aimeric Krol',
    copyright: '© 2025 Siemens. Todos los derechos reservados.',
    application: 'Aplicación',
    languageAndRegion: 'Idioma y región',
    interfaceLanguage: 'Idioma de la interfaz',
    dataManagement: 'Gestión de datos',
    storageUsed: 'Almacenamiento utilizado',
    clearAllData: 'Borrar todos los datos',
    clearAllDataDesc: 'Eliminar todos los proyectos y datos',
    clearAllDataConfirm: 'Confirmar eliminación',
    clearAllDataWarning: '¡Esta acción es irreversible!',
    dataCleared: 'Datos eliminados',
    dataClearedDesc: 'Todos sus datos han sido eliminados',
    applicationSection: 'Aplicación',
    contactDeveloper: 'Contactar desarrollador',
    contact: 'Contacto',
    contactDeveloperMessage: 'Para cualquier pregunta o sugerencia, contacte aimeric.krol@siemens.com',
    consultDocument: 'Ver documento',
    pdfOpenError: 'No se puede abrir el documento PDF',

    // Confidentialité
    privacy: 'Privacidad',
    privacyTitle: 'Política de privacidad',
    dataProtection: 'Protección de datos',
    dataProtectionTitle: 'Protección de datos',
    dataProtectionDesc: 'Sus datos se almacenan localmente en su dispositivo y nunca se transmiten a servidores externos.',
    localStorageTitle: 'Almacenamiento local',
    localStorageDesc: 'Todos sus datos (proyectos, edificios, zonas, compuertas) se guardan solo en su dispositivo.',
    unofficialApp: 'Aplicación no oficial',
    unofficialAppDesc: 'Esta aplicación no está oficialmente aprobada por organismos de normalización.',
    understood: 'Entendido',

    // Langues
    selectLanguage: 'Seleccionar idioma',
    approximateTranslations: 'Traducciones aproximadas',
    translationNote: 'Las traducciones en otros idiomas son aproximadas y pueden contener errores.',

    // Notes
    note: 'Nota',
    newNote: 'Nueva nota',
    editNote: 'Editar nota',
    deleteNote: 'Eliminar nota',
    createNote: 'Crear nota',
    noteTitle: 'Título de la nota',
    noteContent: 'Contenido de la nota',
    noNotes: 'Sin notas',
    noNotesDesc: 'Cree su primera nota para comenzar',
    createFirstNote: 'Crear su primera nota',
    writeYourNote: 'Escriba su nota aquí...',
    noteCreated: 'Nota creada',
    noteUpdated: 'Nota actualizada',
    noteDeleted: 'Nota eliminada',
    deleteNoteConfirm: '¿Está seguro de que desea eliminar esta nota',
    untitledNote: 'Nota sin título',
  },

  it: {
    // Navigation et onglets
    projects: 'Progetti',
    quickCalc: 'Calcolo rapido',
    search: 'Ricerca',
    export: 'Esporta',
    about: 'Informazioni',
    settings: 'Impostazioni',
    notes: 'Note',

    // Titres et sous-titres
    projectsTitle: 'Progetti',
    projectsSubtitle: 'Gestione progetti di estrazione fumi',
    quickCalcTitle: 'Calcolo rapido',
    quickCalcSubtitle: 'Calcolo di conformità semplificato',
    searchTitle: 'Ricerca',
    searchSubtitle: 'Cerca nelle tue serrande',
    exportTitle: 'Esporta',
    exportSubtitle: 'Esporta i tuoi dati',
    aboutTitle: 'Informazioni',
    aboutSubtitle: 'Informazioni sull\'applicazione',
    notesTitle: 'Blocco note',
    notesSubtitle: 'Le tue note e osservazioni',
    settingsTitle: 'Impostazioni',
    settingsSubtitle: 'Configurazione dell\'applicazione',

    // Actions générales
    create: 'Crea',
    edit: 'Modifica',
    delete: 'Elimina',
    save: 'Salva',
    cancel: 'Annulla',
    ok: 'OK',
    yes: 'Sì',
    no: 'No',
    back: 'Indietro',
    next: 'Avanti',
    previous: 'Precedente',
    close: 'Chiudi',
    open: 'Apri',
    loading: 'Caricamento',
    error: 'Errore',
    success: 'Successo',
    warning: 'Avviso',
    info: 'Informazione',

    // Projets
    project: 'Progetto',
    newProject: 'Nuovo progetto',
    editProject: 'Modifica progetto',
    deleteProject: 'Elimina progetto',
    createProject: 'Crea progetto',
    projectName: 'Nome del progetto',
    projectDescription: 'Descrizione del progetto',
    noProjects: 'Nessun progetto',
    noProjectsDesc: 'Crea il tuo primo progetto per iniziare',
    createFirstProject: 'Crea il tuo primo progetto',

    // Bâtiments
    building: 'Edificio',
    buildings: 'Edifici',
    newBuilding: 'Nuovo edificio',
    editBuilding: 'Modifica edificio',
    deleteBuilding: 'Elimina edificio',
    createBuilding: 'Crea edificio',
    buildingName: 'Nome dell\'edificio',
    buildingDescription: 'Descrizione dell\'edificio',
    noBuildings: 'Nessun edificio',
    noBuildingsDesc: 'Aggiungi edifici al tuo progetto',

    // Zones
    zone: 'Zona',
    zones: 'Zone',
    newZone: 'Nuova zona',
    editZone: 'Modifica zona',
    deleteZone: 'Elimina zona',
    createZone: 'Crea zona',
    zoneName: 'Nome della zona',
    zoneDescription: 'Descrizione della zona',
    noZones: 'Nessuna zona',
    noZonesDesc: 'Aggiungi zone di estrazione fumi a questo edificio',
    smokeExtractionZone: 'Zona di estrazione fumi',

    // Volets
    shutter: 'Serranda',
    shutters: 'Serrande',
    newShutter: 'Nuova serranda',
    editShutter: 'Modifica serranda',
    deleteShutter: 'Elimina serranda',
    deleteShutterConfirm: 'Sei sicuro di voler eliminare la serranda',
    createShutter: 'Crea serranda',
    addFirstShutter: 'Aggiungi prima serranda',
    shutterName: 'Nome della serranda',
    shutterType: 'Tipo di serranda',
    shutterHigh: 'Serranda Alta (SA)',
    shutterLow: 'Serranda Bassa (SB)',
    noShutters: 'Nessuna serranda',
    noShuttersDesc: 'Aggiungi serrande a questa zona',

    // Débits et mesures
    referenceFlow: 'Portata di riferimento',
    measuredFlow: 'Portata misurata',
    flowMeasurements: 'Misurazioni di portata',
    cubicMeterPerHour: 'm³/h',
    deviation: 'Deviazione',
    calculatedDeviation: 'Deviazione calcolata',

    // Conformité
    compliance: 'Conformità',
    complianceResult: 'Risultato di conformità',
    compliancePreview: 'Anteprima conformità',
    complianceCalculations: 'Calcoli di conformità',
    compliant: 'Conforme',
    acceptable: 'Accettabile',
    nonCompliant: 'Non conforme',
    functionalDesc: 'Una deviazione inferiore al 10% tra i valori registrati durante questo test funzionale e i valori di riferimento porta alla constatazione del funzionamento previsto del sistema di estrazione meccanica del fumo.',
    acceptableDesc: 'Una deviazione tra il 10% e il 20% tra i valori registrati durante questo test funzionale e i valori di riferimento porta a segnalare questa deriva, attraverso una proposta di azione correttiva all\'operatore o al responsabile della struttura.',
    nonCompliantDesc: 'Una deviazione superiore al 20% tra i valori registrati durante questo test funzionale e i valori di riferimento mantenuti alla messa in servizio deve portare a un\'azione correttiva.',
    invalidReference: 'Riferimento non valido',

    // Formulaires
    nameRequired: 'Il nome è richiesto',
    positiveOrZeroRequired: 'Valore positivo o zero richiesto',
    invalidDate: 'Formato data non valido (GG/MM/AAAA)',
    endDateAfterStart: 'La data di fine deve essere dopo la data di inizio',
    optional: 'opzionale',
    required: 'richiesto',

    // Dates
    startDate: 'Data di inizio',
    endDate: 'Data di fine',
    createdOn: 'Creato il',
    updatedOn: 'Aggiornato il',
    city: 'Città',

    // Remarques
    remarks: 'Osservazioni',

    // Description
    description: 'Descrizione',

    // Recherche
    simpleSearch: 'Ricerca semplice',
    hierarchicalSearch: 'Ricerca gerarchica',
    searchScope: 'Ambito di ricerca',
    searchInSelected: 'Cerca nella selezione',
    searchMinChars: 'Inserisci almeno 2 caratteri per cercare',
    searchResults: 'risultati',
    noResults: 'Nessun risultato',
    noResultsDesc: 'Nessuna serranda corrisponde alla tua ricerca',
    searching: 'Ricerca in corso...',

    // Export
    exportMyData: 'Esporta i miei dati',
    noProjectsToExport: 'Nessun progetto da esportare',
    noProjectsToExportDesc: 'Crea progetti per poterli esportare',
    availableProjects: 'Progetti disponibili',

    // Calcul rapide
    complianceCalculator: 'Calcolatore di conformità',
    clearValues: 'Cancella valori',
    simplifiedModeDesc: 'Inserisci le portate per calcolare la conformità',

    // Norme
    nfStandardDesc: 'Calcoli secondo lo standard NF S61-933 Allegato H',

    // Interface
    generalInfo: 'Informazioni generali',
    version: 'Versione',
    currentVersion: 'Versione corrente',
    appUpToDate: 'App aggiornata',
    loadingData: 'Caricamento dati...',
    dataNotFound: 'Dati non trovati',
    itemNotFound: 'Elemento non trovato',
    saveChanges: 'Salva modifiche',

    // Favoris et sélection
    favorites: 'Preferiti',
    selected: 'selezionato',
    copied: 'copiato',

    // À propos
    appDescription: 'Applicazione di calcolo conformità flusso estrazione fumi',
    developedBy: 'Sviluppato da Aimeric Krol',
    copyright: '© 2025 Siemens. Tutti i diritti riservati.',
    application: 'Applicazione',
    languageAndRegion: 'Lingua e regione',
    interfaceLanguage: 'Lingua dell\'interfaccia',
    dataManagement: 'Gestione dati',
    storageUsed: 'Archiviazione utilizzata',
    clearAllData: 'Cancella tutti i dati',
    clearAllDataDesc: 'Elimina tutti i progetti e dati',
    clearAllDataConfirm: 'Conferma eliminazione',
    clearAllDataWarning: 'Questa azione è irreversibile!',
    dataCleared: 'Dati cancellati',
    dataClearedDesc: 'Tutti i tuoi dati sono stati eliminati',
    applicationSection: 'Applicazione',
    contactDeveloper: 'Contatta sviluppatore',
    contact: 'Contatto',
    contactDeveloperMessage: 'Per domande o suggerimenti, contatta aimeric.krol@siemens.com',
    consultDocument: 'Visualizza documento',
    pdfOpenError: 'Impossibile aprire il documento PDF',

    // Confidentialité
    privacy: 'Privacy',
    privacyTitle: 'Politica sulla privacy',
    dataProtection: 'Protezione dati',
    dataProtectionTitle: 'Protezione dati',
    dataProtectionDesc: 'I tuoi dati sono memorizzati localmente sul tuo dispositivo e non vengono mai trasmessi a server esterni.',
    localStorageTitle: 'Archiviazione locale',
    localStorageDesc: 'Tutti i tuoi dati (progetti, edifici, zone, serrande) sono salvati solo sul tuo dispositivo.',
    unofficialApp: 'Applicazione non ufficiale',
    unofficialAppDesc: 'Questa applicazione non è ufficialmente approvata da organismi di standardizzazione.',
    understood: 'Compreso',

    // Langues
    selectLanguage: 'Seleziona lingua',
    approximateTranslations: 'Traduzioni approssimative',
    translationNote: 'Le traduzioni in altre lingue sono approssimative e possono contenere errori.',

    // Notes
    note: 'Nota',
    newNote: 'Nuova nota',
    editNote: 'Modifica nota',
    deleteNote: 'Elimina nota',
    createNote: 'Crea nota',
    noteTitle: 'Titolo della nota',
    noteContent: 'Contenuto della nota',
    noNotes: 'Nessuna nota',
    noNotesDesc: 'Crea la tua prima nota per iniziare',
    createFirstNote: 'Crea la tua prima nota',
    writeYourNote: 'Scrivi la tua nota qui...',
    noteCreated: 'Nota creata',
    noteUpdated: 'Nota aggiornata',
    noteDeleted: 'Nota eliminata',
    deleteNoteConfirm: 'Sei sicuro di voler eliminare questa nota',
    untitledNote: 'Nota senza titolo',
  }
};

// État global de la langue
let currentLanguage: SupportedLanguage = 'fr';

// Fonction pour obtenir les chaînes de caractères actuelles
export function getStrings(): LanguageStrings {
  return strings[currentLanguage];
}

// Fonction pour obtenir la langue actuelle
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

// Fonction pour changer la langue
export function setLanguage(language: SupportedLanguage): void {
  if (strings[language]) {
    currentLanguage = language;
  }
}

// Fonction pour initialiser la langue (peut être étendue pour détecter la langue du système)
export function initializeLanguage(): void {
  // Pour l'instant, on garde le français par défaut
  // Cette fonction peut être étendue pour détecter la langue du système
  currentLanguage = 'fr';
}

// Fonction pour obtenir les options de langue disponibles
export function getLanguageOptions() {
  return [
    { code: 'fr' as SupportedLanguage, name: 'Français', flag: '🇫🇷' },
    { code: 'en' as SupportedLanguage, name: 'English', flag: '🇬🇧' },
    { code: 'es' as SupportedLanguage, name: 'Español', flag: '🇪🇸' },
    { code: 'it' as SupportedLanguage, name: 'Italiano', flag: '🇮🇹' },
  ];
}