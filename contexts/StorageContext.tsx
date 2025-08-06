import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Project, Building, FunctionalZone, Shutter, SearchResult, Note } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Interface pour la gestion du cache Service Worker
interface CacheManager {
  cacheData: (key: string, data: any) => Promise<void>;
  getCachedData: (key: string) => Promise<any>;
  clearCache: () => Promise<void>;
}

// Interface pour l'historique des calculs rapides
export interface QuickCalcHistoryItem {
  id: string;
  referenceFlow: number;
  measuredFlow: number;
  deviation: number;
  status: 'compliant' | 'acceptable' | 'non-compliant';
  color: string;
  timestamp: Date;
}

interface StorageContextType {
  // État de chargement
  isLoading: boolean;
  isInitialized: boolean;
  
  // Données principales
  projects: Project[];
  favoriteProjects: string[];
  favoriteBuildings: string[];
  favoriteZones: string[];
  favoriteShutters: string[];
  favoriteNotes: string[];
  quickCalcHistory: QuickCalcHistoryItem[];
  notes: Note[];
  
  // Actions pour les projets
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'buildings'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  
  // Actions pour les bâtiments
  createBuilding: (projectId: string, buildingData: Omit<Building, 'id' | 'projectId' | 'createdAt' | 'functionalZones'>) => Promise<Building | null>;
  updateBuilding: (buildingId: string, updates: Partial<Building>) => Promise<Building | null>;
  deleteBuilding: (buildingId: string) => Promise<boolean>;
  
  // Actions pour les zones
  createFunctionalZone: (buildingId: string, zoneData: Omit<FunctionalZone, 'id' | 'buildingId' | 'createdAt' | 'shutters'>) => Promise<FunctionalZone | null>;
  updateFunctionalZone: (zoneId: string, updates: Partial<FunctionalZone>) => Promise<FunctionalZone | null>;
  deleteFunctionalZone: (zoneId: string) => Promise<boolean>;
  
  // Actions pour les volets
  createShutter: (zoneId: string, shutterData: Omit<Shutter, 'id' | 'zoneId' | 'createdAt' | 'updatedAt'>) => Promise<Shutter | null>;
  updateShutter: (shutterId: string, updates: Partial<Shutter>) => Promise<Shutter | null>;
  deleteShutter: (shutterId: string) => Promise<boolean>;
  
  // Actions pour les favoris
  setFavoriteProjects: (favorites: string[]) => Promise<void>;
  setFavoriteBuildings: (favorites: string[]) => Promise<void>;
  setFavoriteZones: (favorites: string[]) => Promise<void>;
  setFavoriteShutters: (favorites: string[]) => Promise<void>;
  setFavoriteNotes: (favorites: string[]) => Promise<void>;
  
  // Actions pour l'historique
  addQuickCalcHistory: (item: Omit<QuickCalcHistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  clearQuickCalcHistory: () => Promise<void>;
  removeQuickCalcHistoryItem: (itemId: string) => Promise<void>;
  getQuickCalcHistory: () => Promise<QuickCalcHistoryItem[]>;
  
  // Actions pour les notes
  createNote: (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  
  // Recherche
  searchShutters: (query: string) => SearchResult[];
  
  // Utilitaires
  clearAllData: () => Promise<void>;
  getStorageInfo: () => { projectsCount: number; totalShutters: number; storageSize: string };
  getProjects: () => Promise<Project[]>;
  getFavoriteBuildings: () => Promise<string[]>;
  getFavoriteZones: () => Promise<string[]>;
  getFavoriteShutters: () => Promise<string[]>;
  getFavoriteNotes: () => Promise<string[]>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

// Clés de stockage simplifiées
const STORAGE_KEYS = {
  PROJECTS: 'SIEMENS_PROJECTS',
  FAVORITE_PROJECTS: 'SIEMENS_FAV_PROJECTS',
  FAVORITE_BUILDINGS: 'SIEMENS_FAV_BUILDINGS',
  FAVORITE_ZONES: 'SIEMENS_FAV_ZONES',
  FAVORITE_SHUTTERS: 'SIEMENS_FAV_SHUTTERS',
  FAVORITE_NOTES: 'SIEMENS_FAV_NOTES',
  QUICK_CALC_HISTORY: 'SIEMENS_CALC_HISTORY',
  NOTES: 'SIEMENS_NOTES',
};

// Fonction utilitaire pour générer un ID unique
function generateUniqueId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}_${random}`;
}

// Fonction utilitaire sécurisée pour AsyncStorage
async function safeStorageOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn(`Storage ${operationName} failed:`, error);
    return fallback;
  }
}

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  // États React pour toutes les données
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [favoriteProjects, setFavoriteProjectsState] = useState<string[]>([]);
  const [favoriteBuildings, setFavoriteBuildingsState] = useState<string[]>([]);
  const [favoriteZones, setFavoriteZonesState] = useState<string[]>([]);
  const [favoriteShutters, setFavoriteShuttersState] = useState<string[]>([]);
  const [favoriteNotes, setFavoriteNotesState] = useState<string[]>([]);
  const [quickCalcHistory, setQuickCalcHistoryState] = useState<QuickCalcHistoryItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Ref pour maintenir la version la plus récente des projets
  const projectsRef = useRef<Project[]>([]);

  // Mettre à jour la ref chaque fois que l'état projects change
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Initialisation au montage du provider
  useEffect(() => {
    initializeStorage();
  }, []);

  const initializeStorage = async () => {
    try {
      console.log('📦 Initialisation du stockage...');
      setIsLoading(true);
      
      // Charger les projets
      const projectsData = await safeStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        null,
        'getProjects'
      );

      try {
        if (projectsData && projectsData !== 'undefined' && projectsData !== 'null') {
          const parsedProjects = JSON.parse(projectsData);
          const processedProjects = Array.isArray(parsedProjects) ? parsedProjects.map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt || Date.now()),
            updatedAt: new Date(project.updatedAt || Date.now()),
            startDate: project.startDate ? new Date(project.startDate) : undefined,
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            buildings: (project.buildings || []).map((building: any) => ({
              ...building,
              createdAt: new Date(building.createdAt || Date.now()),
              functionalZones: (building.functionalZones || []).map((zone: any) => ({
                ...zone,
                createdAt: new Date(zone.createdAt || Date.now()),
                shutters: (zone.shutters || []).map((shutter: any) => ({
                  ...shutter,
                  createdAt: new Date(shutter.createdAt || Date.now()),
                  updatedAt: new Date(shutter.updatedAt || Date.now())
                }))
              }))
            }))
          })) : [];
          setProjects(processedProjects);
          console.log(`✅ ${processedProjects.length} projets chargés`);
        } else {
          console.log('📝 Aucun projet existant ou données invalides');
          setProjects([]);
        }
      } catch (error) {
        console.warn('Erreur parsing projets, initialisation par défaut:', error);
        setProjects([]);
      }

      // Charger les favoris de manière séquentielle pour éviter les problèmes
      const favProjectsData = await safeStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_PROJECTS),
        null,
        'getFavProjects'
      );
      try {
        setFavoriteProjectsState(favProjectsData && favProjectsData !== 'undefined' && favProjectsData !== 'null' ? JSON.parse(favProjectsData) : []);
      } catch (error) {
        console.warn('Erreur parsing favoris projets:', error);
        setFavoriteProjectsState([]);
      }

      const favBuildingsData = await safeStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_BUILDINGS),
        null,
        'getFavBuildings'
      );
      try {
        setFavoriteBuildingsState(favBuildingsData && favBuildingsData !== 'undefined' && favBuildingsData !== 'null' ? JSON.parse(favBuildingsData) : []);
      } catch (error) {
        console.warn('Erreur parsing favoris bâtiments:', error);
        setFavoriteBuildingsState([]);
      }

      const favZonesData = await safeStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_ZONES),
        null,
        'getFavZones'
      );
      try {
        setFavoriteZonesState(favZonesData && favZonesData !== 'undefined' && favZonesData !== 'null' ? JSON.parse(favZonesData) : []);
      } catch (error) {
        console.warn('Erreur parsing favoris zones:', error);
        setFavoriteZonesState([]);
      }

      const favShuttersData = await safeStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_SHUTTERS),
        null,
        'getFavShutters'
      );
      try {
        setFavoriteShuttersState(favShuttersData && favShuttersData !== 'undefined' && favShuttersData !== 'null' ? JSON.parse(favShuttersData) : []);
      } catch (error) {
        console.warn('Erreur parsing favoris volets:', error);
        setFavoriteShuttersState([]);
      }

      const favNotesData = await safeStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_NOTES),
        null,
        'getFavNotes'
      );
      try {
        setFavoriteNotesState(favNotesData && favNotesData !== 'undefined' && favNotesData !== 'null' ? JSON.parse(favNotesData) : []);
      } catch (error) {
        console.warn('Erreur parsing favoris notes:', error);
        setFavoriteNotesState([]);
      }

      // Charger l'historique
      const historyData = await safeStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.QUICK_CALC_HISTORY),
        null,
        'getHistory'
      );
      
      try {
        if (historyData && historyData !== 'undefined' && historyData !== 'null') {
          const parsedHistory = JSON.parse(historyData);
          const processedHistory = Array.isArray(parsedHistory) ? parsedHistory.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp || Date.now())
          })) : [];
          setQuickCalcHistoryState(processedHistory);
        } else {
          setQuickCalcHistoryState([]);
        }
      } catch (error) {
        console.warn('Erreur parsing historique:', error);
        setQuickCalcHistoryState([]);
      }

      // Charger les notes
      const notesData = await safeStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.NOTES),
        null,
        'getNotes'
      );
      
      try {
        if (notesData && notesData !== 'undefined' && notesData !== 'null') {
          const parsedNotes = JSON.parse(notesData);
          const processedNotes = Array.isArray(parsedNotes) ? parsedNotes.map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt || Date.now()),
            updatedAt: new Date(note.updatedAt || Date.now()),
            images: note.images || []
          })) : [];
          setNotes(processedNotes);
        } else {
          setNotes([]);
        }
      } catch (error) {
        console.warn('Erreur parsing notes:', error);
        setNotes([]);
      }

      console.log('✅ Stockage initialisé avec succès');
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Erreur initialisation storage:', error);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction utilitaire pour sauvegarder les projets
  const saveProjects = async (newProjects: Project[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(newProjects));
      setProjects(newProjects);
      
      // Cache dans le Service Worker pour l'accès hors ligne
      if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
        try {
          const cache = await caches.open('siemens-runtime-v2.1.0');
          const response = new Response(JSON.stringify(newProjects), {
            headers: { 'Content-Type': 'application/json' }
          });
          await cache.put('/api/projects', response);
          console.log('💾 Projets mis en cache Service Worker');
        } catch (error) {
          console.warn('⚠️ Erreur cache Service Worker:', error);
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde projets:', error);
      throw error;
    }
  };

  // Actions pour les projets
  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'buildings'>): Promise<Project> => {
    const newProject: Project = {
      ...projectData,
      id: generateUniqueId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      buildings: []
    };
    
    const newProjects = [...projectsRef.current, newProject];
    await saveProjects(newProjects);
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<Project | null> => {
    const projectIndex = projectsRef.current.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return null;
    }
    
    const updatedProject = { ...projectsRef.current[projectIndex], ...updates, updatedAt: new Date() };
    const newProjects = [...projectsRef.current];
    newProjects[projectIndex] = updatedProject;
    
    await saveProjects(newProjects);
    return updatedProject;
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    const projectIndex = projectsRef.current.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return false;
    }
    
    const newProjects = projectsRef.current.filter(p => p.id !== id);
    const newFavoriteProjects = favoriteProjects.filter(fId => fId !== id);
    
    await Promise.all([
      saveProjects(newProjects),
      setFavoriteProjects(newFavoriteProjects)
    ]);
    
    return true;
  };

  // Actions pour les bâtiments
  const createBuilding = async (projectId: string, buildingData: Omit<Building, 'id' | 'projectId' | 'createdAt' | 'functionalZones'>): Promise<Building | null> => {
    const projectIndex = projectsRef.current.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return null;
    }

    const newBuilding: Building = {
      ...buildingData,
      id: generateUniqueId(),
      projectId,
      createdAt: new Date(),
      functionalZones: []
    };

    const newProjects = [...projectsRef.current];
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      buildings: [...newProjects[projectIndex].buildings, newBuilding],
      updatedAt: new Date()
    };

    await saveProjects(newProjects);
    return newBuilding;
  };

  const updateBuilding = async (buildingId: string, updates: Partial<Building>): Promise<Building | null> => {
    const newProjects = [...projectsRef.current];
    
    for (let i = 0; i < newProjects.length; i++) {
      const buildingIndex = newProjects[i].buildings.findIndex(b => b.id === buildingId);
      if (buildingIndex !== -1) {
        const updatedBuilding = { ...newProjects[i].buildings[buildingIndex], ...updates };
        newProjects[i] = {
          ...newProjects[i],
          buildings: [
            ...newProjects[i].buildings.slice(0, buildingIndex),
            updatedBuilding,
            ...newProjects[i].buildings.slice(buildingIndex + 1)
          ],
          updatedAt: new Date()
        };
        
        await saveProjects(newProjects);
        return updatedBuilding;
      }
    }
    
    return null;
  };

  const deleteBuilding = async (buildingId: string): Promise<boolean> => {
    const newProjects = [...projectsRef.current];
    let found = false;
    
    console.log('🗑️ Début suppression bâtiment:', buildingId);
    
    for (let i = 0; i < newProjects.length; i++) {
      // Vérification de sécurité pour le projet
      if (!newProjects[i] || !newProjects[i].buildings) {
        console.warn('⚠️ Projet ou liste de bâtiments introuvable à l\'index:', i);
        continue;
      }
      
      const buildingIndex = newProjects[i].buildings.findIndex(b => b.id === buildingId);
      if (buildingIndex !== -1) {
        console.log('✅ Bâtiment trouvé dans projet:', newProjects[i].name);
        newProjects[i] = {
          ...newProjects[i],
          buildings: (newProjects[i].buildings || []).filter(b => b.id !== buildingId),
          updatedAt: new Date()
        };
        found = true;
        break;
      }
    }
    
    if (found) {
      console.log('💾 Sauvegarde après suppression bâtiment');
      const newFavoriteBuildings = (favoriteBuildings || []).filter(fId => fId !== buildingId);
      await Promise.all([
        saveProjects(newProjects),
        setFavoriteBuildings(newFavoriteBuildings)
      ]);
      console.log('✅ Bâtiment supprimé avec succès');
    } else {
      console.error('❌ Bâtiment non trouvé pour suppression:', buildingId);
    }
    
    return found;
  };

  // Actions pour les zones
  const createFunctionalZone = async (buildingId: string, zoneData: Omit<FunctionalZone, 'id' | 'buildingId' | 'createdAt' | 'shutters'>): Promise<FunctionalZone | null> => {
    const newProjects = [...projectsRef.current];
    
    for (let i = 0; i < newProjects.length; i++) {
      const buildingIndex = newProjects[i].buildings.findIndex(b => b.id === buildingId);
      if (buildingIndex !== -1) {
        const newZone: FunctionalZone = {
          ...zoneData,
          id: generateUniqueId(),
          buildingId,
          createdAt: new Date(),
          shutters: []
        };
        
        newProjects[i] = {
          ...newProjects[i],
          buildings: [
            ...newProjects[i].buildings.slice(0, buildingIndex),
            {
              ...newProjects[i].buildings[buildingIndex],
              functionalZones: [...newProjects[i].buildings[buildingIndex].functionalZones, newZone]
            },
            ...newProjects[i].buildings.slice(buildingIndex + 1)
          ],
          updatedAt: new Date()
        };
        
        await saveProjects(newProjects);
        return newZone;
      }
    }
    
    return null;
  };

  const updateFunctionalZone = async (zoneId: string, updates: Partial<FunctionalZone>): Promise<FunctionalZone | null> => {
    const newProjects = [...projectsRef.current];
    
    for (let i = 0; i < newProjects.length; i++) {
      for (let j = 0; j < newProjects[i].buildings.length; j++) {
        const zoneIndex = newProjects[i].buildings[j].functionalZones.findIndex(z => z.id === zoneId);
        if (zoneIndex !== -1) {
          const updatedZone = { ...newProjects[i].buildings[j].functionalZones[zoneIndex], ...updates };
          
          newProjects[i] = {
            ...newProjects[i],
            buildings: [
              ...newProjects[i].buildings.slice(0, j),
              {
                ...newProjects[i].buildings[j],
                functionalZones: [
                  ...newProjects[i].buildings[j].functionalZones.slice(0, zoneIndex),
                  updatedZone,
                  ...newProjects[i].buildings[j].functionalZones.slice(zoneIndex + 1)
                ]
              },
              ...newProjects[i].buildings.slice(j + 1)
            ],
            updatedAt: new Date()
          };
          
          await saveProjects(newProjects);
          return updatedZone;
        }
      }
    }
    
    return null;
  };

  const deleteFunctionalZone = async (zoneId: string): Promise<boolean> => {
    const newProjects = [...projectsRef.current];
    let found = false;
    
    console.log('🗑️ Début suppression zone:', zoneId);
    
    for (let i = 0; i < newProjects.length; i++) {
      // Vérification de sécurité pour le projet
      if (!newProjects[i] || !newProjects[i].buildings) {
        console.warn('⚠️ Projet ou liste de bâtiments introuvable à l\'index:', i);
        continue;
      }
      
      for (let j = 0; j < newProjects[i].buildings.length; j++) {
        // Vérification de sécurité pour le bâtiment
        if (!newProjects[i].buildings[j] || !newProjects[i].buildings[j].functionalZones) {
          console.warn('⚠️ Bâtiment ou liste de zones introuvable à l\'index:', j);
          continue;
        }
        
        const zoneIndex = newProjects[i].buildings[j].functionalZones.findIndex(z => z.id === zoneId);
        if (zoneIndex !== -1) {
          console.log('✅ Zone trouvée dans bâtiment:', newProjects[i].buildings[j].name);
          newProjects[i] = {
            ...newProjects[i],
            buildings: [
              ...newProjects[i].buildings.slice(0, j),
              {
                ...newProjects[i].buildings[j],
                functionalZones: (newProjects[i].buildings[j].functionalZones || []).filter(z => z && z.id !== zoneId)
              },
              ...newProjects[i].buildings.slice(j + 1)
            ],
            updatedAt: new Date()
          };
          found = true;
          break;
        }
      }
      if (found) break;
    }
    
    if (found) {
      console.log('💾 Sauvegarde après suppression zone');
      const newFavoriteZones = (favoriteZones || []).filter(fId => fId !== zoneId);
      await Promise.all([
        saveProjects(newProjects),
        setFavoriteZones(newFavoriteZones)
      ]);
      console.log('✅ Zone supprimée avec succès');
    } else {
      console.error('❌ Zone non trouvée pour suppression:', zoneId);
    }
    
    return found;
  };

  // Actions pour les volets
  const createShutter = async (zoneId: string, shutterData: Omit<Shutter, 'id' | 'zoneId' | 'createdAt' | 'updatedAt'>): Promise<Shutter | null> => {
    const newProjects = [...projectsRef.current];
    
    console.log('🔍 Recherche de la zone:', zoneId, 'pour créer le volet:', shutterData.name);
    
    for (let i = 0; i < newProjects.length; i++) {
      for (let j = 0; j < newProjects[i].buildings.length; j++) {
        const zoneIndex = newProjects[i].buildings[j].functionalZones.findIndex(z => z.id === zoneId);
        if (zoneIndex !== -1) {
          console.log('✅ Zone trouvée dans le projet:', newProjects[i].name, 'bâtiment:', newProjects[i].buildings[j].name);
          
          const newShutter: Shutter = {
            ...shutterData,
            id: generateUniqueId(),
            zoneId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          console.log('💾 Préparation du volet:', newShutter.name, 'type:', newShutter.type, 'dans la zone:', zoneId);
          
          newProjects[i] = {
            ...newProjects[i],
            buildings: [
              ...newProjects[i].buildings.slice(0, j),
              {
                ...newProjects[i].buildings[j],
                functionalZones: [
                  ...newProjects[i].buildings[j].functionalZones.slice(0, zoneIndex),
                  {
                    ...newProjects[i].buildings[j].functionalZones[zoneIndex],
                    shutters: [...newProjects[i].buildings[j].functionalZones[zoneIndex].shutters, newShutter]
                  },
                  ...newProjects[i].buildings[j].functionalZones.slice(zoneIndex + 1)
                ]
              },
              ...newProjects[i].buildings.slice(j + 1)
            ],
            updatedAt: new Date()
          };
          
          await saveProjects(newProjects);
          console.log('✅ Volet sauvegardé avec succès:', newShutter.name, 'ID:', newShutter.id);
          return newShutter;
        }
      }
    }
    
    console.error('❌ Zone non trouvée pour créer le volet:', zoneId, 'Données du volet:', shutterData.name);
    return null;
  };

  const updateShutter = async (shutterId: string, updates: Partial<Shutter>): Promise<Shutter | null> => {
    const newProjects = [...projectsRef.current];
    
    for (let i = 0; i < newProjects.length; i++) {
      for (let j = 0; j < newProjects[i].buildings.length; j++) {
        for (let k = 0; k < newProjects[i].buildings[j].functionalZones.length; k++) {
          const shutterIndex = newProjects[i].buildings[j].functionalZones[k].shutters.findIndex(s => s.id === shutterId);
          if (shutterIndex !== -1) {
            const updatedShutter = { 
              ...newProjects[i].buildings[j].functionalZones[k].shutters[shutterIndex], 
              ...updates, 
              updatedAt: new Date() 
            };
            
            newProjects[i] = {
              ...newProjects[i],
              buildings: [
                ...newProjects[i].buildings.slice(0, j),
                {
                  ...newProjects[i].buildings[j],
                  functionalZones: [
                    ...newProjects[i].buildings[j].functionalZones.slice(0, k),
                    {
                      ...newProjects[i].buildings[j].functionalZones[k],
                      shutters: [
                        ...newProjects[i].buildings[j].functionalZones[k].shutters.slice(0, shutterIndex),
                        updatedShutter,
                        ...newProjects[i].buildings[j].functionalZones[k].shutters.slice(shutterIndex + 1)
                      ]
                    },
                    ...newProjects[i].buildings[j].functionalZones.slice(k + 1)
                  ]
                },
                ...newProjects[i].buildings.slice(j + 1)
              ],
              updatedAt: new Date()
            };
            
            await saveProjects(newProjects);
            return updatedShutter;
          }
        }
      }
    }
    
    return null;
  };

  const deleteShutter = async (shutterId: string): Promise<boolean> => {
    const newProjects = [...projectsRef.current];
    let found = false;
    
    console.log('🗑️ Début suppression volet:', shutterId);
    
    for (let i = 0; i < newProjects.length; i++) {
      // Vérification de sécurité pour le projet
      if (!newProjects[i] || !newProjects[i].buildings) {
        console.warn('⚠️ Projet ou liste de bâtiments introuvable à l\'index:', i);
        continue;
      }
      
      for (let j = 0; j < newProjects[i].buildings.length; j++) {
        // Vérification de sécurité pour le bâtiment
        if (!newProjects[i].buildings[j] || !newProjects[i].buildings[j].functionalZones) {
          console.warn('⚠️ Bâtiment ou liste de zones introuvable à l\'index:', j);
          continue;
        }
        
        for (let k = 0; k < newProjects[i].buildings[j].functionalZones.length; k++) {
          // Vérification de sécurité pour la zone
          if (!newProjects[i].buildings[j].functionalZones[k] || !newProjects[i].buildings[j].functionalZones[k].shutters) {
            console.warn('⚠️ Zone ou liste de volets introuvable à l\'index:', k);
            continue;
          }
          
          const shutterIndex = newProjects[i].buildings[j].functionalZones[k].shutters.findIndex(s => s.id === shutterId);
          if (shutterIndex !== -1) {
            console.log('✅ Volet trouvé dans zone:', newProjects[i].buildings[j].functionalZones[k].name);
            newProjects[i] = {
              ...newProjects[i],
              buildings: [
                ...newProjects[i].buildings.slice(0, j),
                {
                  ...newProjects[i].buildings[j],
                  functionalZones: [
                    ...newProjects[i].buildings[j].functionalZones.slice(0, k),
                    {
                      ...newProjects[i].buildings[j].functionalZones[k],
                      shutters: (newProjects[i].buildings[j].functionalZones[k].shutters || []).filter(s => s && s.id !== shutterId)
                    },
                    ...newProjects[i].buildings[j].functionalZones.slice(k + 1)
                  ]
                },
                ...newProjects[i].buildings.slice(j + 1)
              ],
              updatedAt: new Date()
            };
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    
    if (found) {
      console.log('💾 Sauvegarde après suppression volet');
      const newFavoriteShutters = (favoriteShutters || []).filter(fId => fId !== shutterId);
      await Promise.all([
        saveProjects(newProjects),
        setFavoriteShutters(newFavoriteShutters)
      ]);
      console.log('✅ Volet supprimé avec succès');
    } else {
      console.error('❌ Volet non trouvé pour suppression:', shutterId);
    }
    
    return found;
  };

  // Actions pour les favoris
  const setFavoriteProjects = async (favorites: string[]) => {
    await safeStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_PROJECTS, JSON.stringify(favorites)),
      undefined,
      'setFavoriteProjects'
    );
    setFavoriteProjectsState(favorites);
  };

  const setFavoriteBuildings = async (favorites: string[]) => {
    await safeStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_BUILDINGS, JSON.stringify(favorites)),
      undefined,
      'setFavoriteBuildings'
    );
    setFavoriteBuildingsState(favorites);
  };

  const setFavoriteZones = async (favorites: string[]) => {
    await safeStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_ZONES, JSON.stringify(favorites)),
      undefined,
      'setFavoriteZones'
    );
    setFavoriteZonesState(favorites);
  };

  const setFavoriteShutters = async (favorites: string[]) => {
    await safeStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_SHUTTERS, JSON.stringify(favorites)),
      undefined,
      'setFavoriteShutters'
    );
    setFavoriteShuttersState(favorites);
  };

  const setFavoriteNotes = async (favorites: string[]) => {
    await safeStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_NOTES, JSON.stringify(favorites)),
      undefined,
      'setFavoriteNotes'
    );
    setFavoriteNotesState(favorites);
  };

  // Actions pour l'historique
  const addQuickCalcHistory = async (item: Omit<QuickCalcHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: QuickCalcHistoryItem = {
      ...item,
      id: generateUniqueId(),
      timestamp: new Date()
    };
    
    const newHistory = [newItem, ...quickCalcHistory];
    
    await safeStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.QUICK_CALC_HISTORY, JSON.stringify(newHistory)),
      undefined,
      'addQuickCalcHistory'
    );
    setQuickCalcHistoryState(newHistory);
  };

  const clearQuickCalcHistory = async () => {
    await safeStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.QUICK_CALC_HISTORY, JSON.stringify([])),
      undefined,
      'clearQuickCalcHistory'
    );
    setQuickCalcHistoryState([]);
  };

  const removeQuickCalcHistoryItem = async (itemId: string) => {
    const newHistory = quickCalcHistory.filter(item => item.id !== itemId);
    
    await safeStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.QUICK_CALC_HISTORY, JSON.stringify(newHistory)),
      undefined,
      'removeQuickCalcHistoryItem'
    );
    setQuickCalcHistoryState(newHistory);
  };

  const getQuickCalcHistory = async (): Promise<QuickCalcHistoryItem[]> => {
    return quickCalcHistory;
  };

  // Actions pour les notes
  const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const newNote: Note = {
      ...noteData,
      id: generateUniqueId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newNotes = [newNote, ...notes];
    await saveNotes(newNotes);
    return newNote;
  };

  const updateNote = async (id: string, updates: Partial<Note>): Promise<Note | null> => {
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex === -1) {
      return null;
    }
    
    const updatedNote = { ...notes[noteIndex], ...updates, updatedAt: new Date() };
    const newNotes = [...notes];
    newNotes[noteIndex] = updatedNote;
    
    await saveNotes(newNotes);
    return updatedNote;
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex === -1) {
      return false;
    }
    
    const newNotes = notes.filter(n => n.id !== id);
    await saveNotes(newNotes);
    return true;
  };

  // Fonction utilitaire pour sauvegarder les notes
  const saveNotes = async (newNotes: Note[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(newNotes));
      setNotes(newNotes);
      
      // Cache dans le Service Worker pour l'accès hors ligne
      if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
        try {
          const cache = await caches.open('siemens-runtime-v2.1.0');
          const response = new Response(JSON.stringify(newNotes), {
            headers: { 'Content-Type': 'application/json' }
          });
          await cache.put('/api/notes', response);
          console.log('💾 Notes mises en cache Service Worker');
        } catch (error) {
          console.warn('⚠️ Erreur cache Service Worker notes:', error);
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      throw error;
    }
  };

  // Recherche
  const searchShutters = (query: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const queryWords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);

    for (const project of projectsRef.current) {
      for (const building of project.buildings) {
        for (const zone of building.functionalZones) {
          for (const shutter of zone.shutters) {
            const searchableText = [
              shutter.name,
              zone.name,
              building.name,
              project.name,
              project.city || '',
              shutter.remarks || ''
            ].join(' ').toLowerCase();
            
            const matchesAllWords = queryWords.every(word => searchableText.includes(word));
            
            if (matchesAllWords) {
              results.push({ shutter, zone, building, project });
            }
          }
        }
      }
    }

    return results;
  };

  // Utilitaires
  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      
      setProjects([]);
      setFavoriteProjectsState([]);
      setFavoriteBuildingsState([]);
      setFavoriteZonesState([]);
      setFavoriteShuttersState([]);
      setFavoriteNotesState([]);
      setQuickCalcHistoryState([]);
      setNotes([]);
    } catch (error) {
      console.warn('Erreur suppression données:', error);
      throw error;
    }
  };

  const getStorageInfo = () => {
    const totalShutters = projectsRef.current.reduce((total, project) => 
      total + project.buildings.reduce((buildingTotal, building) => 
        buildingTotal + building.functionalZones.reduce((zoneTotal, zone) => 
          zoneTotal + zone.shutters.length, 0), 0), 0);

    const dataString = JSON.stringify(projectsRef.current);
    const storageSize = `${(dataString.length / 1024).toFixed(2)} KB`;

    return {
      projectsCount: projectsRef.current.length,
      totalShutters,
      storageSize
    };
  };

  // Fonctions de compatibilité
  const getProjects = async (): Promise<Project[]> => {
    return projectsRef.current;
  };

  const getFavoriteBuildings = async (): Promise<string[]> => {
    return favoriteBuildings;
  };

  const getFavoriteZones = async (): Promise<string[]> => {
    return favoriteZones;
  };

  const getFavoriteShutters = async (): Promise<string[]> => {
    return favoriteShutters;
  };

  const getFavoriteNotes = async (): Promise<string[]> => {
    return favoriteNotes;
  };

  const value: StorageContextType = {
    isLoading,
    isInitialized,
    projects,
    favoriteProjects,
    favoriteBuildings,
    favoriteZones,
    favoriteShutters,
    favoriteNotes,
    quickCalcHistory,
    notes,
    createProject,
    updateProject,
    deleteProject,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    createFunctionalZone,
    updateFunctionalZone,
    deleteFunctionalZone,
    createShutter,
    updateShutter,
    deleteShutter,
    setFavoriteProjects,
    setFavoriteBuildings,
    setFavoriteZones,
    setFavoriteShutters,
    setFavoriteNotes,
    addQuickCalcHistory,
    clearQuickCalcHistory,
    removeQuickCalcHistoryItem,
    getQuickCalcHistory,
    createNote,
    updateNote,
    deleteNote,
    searchShutters,
    clearAllData,
    getStorageInfo,
    getProjects,
    getFavoriteBuildings,
    getFavoriteZones,
    getFavoriteShutters,
    getFavoriteNotes,
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): StorageContextType {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}