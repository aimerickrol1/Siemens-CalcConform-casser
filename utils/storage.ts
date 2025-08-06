import { Project, Building, FunctionalZone, Shutter, SearchResult } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage
const PROJECTS_KEY = 'SIEMENS_PROJECTS_STORAGE';
const FAVORITE_PROJECTS_KEY = 'SIEMENS_FAVORITE_PROJECTS';
const FAVORITE_BUILDINGS_KEY = 'SIEMENS_FAVORITE_BUILDINGS';
const FAVORITE_ZONES_KEY = 'SIEMENS_FAVORITE_ZONES';
const FAVORITE_SHUTTERS_KEY = 'SIEMENS_FAVORITE_SHUTTERS';
const QUICK_CALC_HISTORY_KEY = 'SIEMENS_QUICK_CALC_HISTORY'; // NOUVEAU

// NOUVEAU : Interface pour l'historique des calculs rapides
export interface QuickCalcHistoryItem {
  id: string;
  referenceFlow: number;
  measuredFlow: number;
  deviation: number;
  status: 'compliant' | 'acceptable' | 'non-compliant';
  color: string;
  timestamp: Date;
}

// Cache en mémoire pour les performances
let projects: Project[] = [];
let favoriteProjects: string[] = [];
let favoriteBuildings: string[] = [];
let favoriteZones: string[] = [];
let favoriteShutters: string[] = [];
let quickCalcHistory: QuickCalcHistoryItem[] = []; // NOUVEAU

// Variables pour éviter les chargements multiples
let isProjectsLoaded = false;
let isFavoritesLoaded = false;
let isQuickCalcHistoryLoaded = false; // NOUVEAU
let isInitialized = false;

// Fonction utilitaire pour sauvegarder les projets
async function saveProjects(): Promise<void> {
  try {
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    console.log('Projets sauvegardés:', projects.length);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des projets:', error);
  }
}

// Fonction utilitaire pour charger les projets
async function loadProjectsFromStorage(): Promise<void> {
  if (isProjectsLoaded) {
    console.log('Projets déjà chargés depuis le cache');
    return;
  }
  
  try {
    console.log('Chargement des projets depuis AsyncStorage...');
    const data = await AsyncStorage.getItem(PROJECTS_KEY);
    
    if (data) {
      const parsedProjects = JSON.parse(data);
      console.log('Données brutes chargées:', parsedProjects.length, 'projets');
      
      // Convertir les dates string en objets Date
      projects = parsedProjects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        buildings: project.buildings.map((building: any) => ({
          ...building,
          createdAt: new Date(building.createdAt),
          functionalZones: building.functionalZones.map((zone: any) => ({
            ...zone,
            createdAt: new Date(zone.createdAt),
            shutters: zone.shutters.map((shutter: any) => ({
              ...shutter,
              createdAt: new Date(shutter.createdAt),
              updatedAt: new Date(shutter.updatedAt)
            }))
          }))
        }))
      }));
      
      console.log('Projets traités:', projects.length);
    } else {
      console.log('Aucune donnée trouvée dans AsyncStorage');
      projects = [];
    }
    
    isProjectsLoaded = true;
  } catch (error) {
    console.error('Erreur lors du chargement des projets:', error);
    projects = [];
    isProjectsLoaded = true;
  }
}

// Fonction utilitaire pour sauvegarder les favoris
async function saveFavorites(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(FAVORITE_PROJECTS_KEY, JSON.stringify(favoriteProjects)),
      AsyncStorage.setItem(FAVORITE_BUILDINGS_KEY, JSON.stringify(favoriteBuildings)),
      AsyncStorage.setItem(FAVORITE_ZONES_KEY, JSON.stringify(favoriteZones)),
      AsyncStorage.setItem(FAVORITE_SHUTTERS_KEY, JSON.stringify(favoriteShutters))
    ]);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des favoris:', error);
  }
}

// Fonction utilitaire pour charger les favoris
async function loadFavoritesFromStorage(): Promise<void> {
  if (isFavoritesLoaded) return;
  
  try {
    const [projectsData, buildingsData, zonesData, shuttersData] = await Promise.all([
      AsyncStorage.getItem(FAVORITE_PROJECTS_KEY),
      AsyncStorage.getItem(FAVORITE_BUILDINGS_KEY),
      AsyncStorage.getItem(FAVORITE_ZONES_KEY),
      AsyncStorage.getItem(FAVORITE_SHUTTERS_KEY)
    ]);

    favoriteProjects = projectsData ? JSON.parse(projectsData) : [];
    favoriteBuildings = buildingsData ? JSON.parse(buildingsData) : [];
    favoriteZones = zonesData ? JSON.parse(zonesData) : [];
    favoriteShutters = shuttersData ? JSON.parse(shuttersData) : [];
    
    isFavoritesLoaded = true;
  } catch (error) {
    console.error('Erreur lors du chargement des favoris:', error);
    favoriteProjects = [];
    favoriteBuildings = [];
    favoriteZones = [];
    favoriteShutters = [];
    isFavoritesLoaded = true;
  }
}

// NOUVEAU : Fonction utilitaire pour sauvegarder l'historique des calculs rapides
async function saveQuickCalcHistory(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUICK_CALC_HISTORY_KEY, JSON.stringify(quickCalcHistory));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'historique des calculs rapides:', error);
  }
}

// NOUVEAU : Fonction utilitaire pour charger l'historique des calculs rapides
async function loadQuickCalcHistoryFromStorage(): Promise<void> {
  if (isQuickCalcHistoryLoaded) return;
  
  try {
    const data = await AsyncStorage.getItem(QUICK_CALC_HISTORY_KEY);
    
    if (data) {
      const parsedHistory = JSON.parse(data);
      // Convertir les dates string en objets Date
      quickCalcHistory = parsedHistory.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } else {
      quickCalcHistory = [];
    }
    
    isQuickCalcHistoryLoaded = true;
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique des calculs rapides:', error);
    quickCalcHistory = [];
    isQuickCalcHistoryLoaded = true;
  }
}

// Fonction pour générer un ID unique plus robuste
function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const storage = {
  // Initialisation du stockage
  async initialize(): Promise<void> {
    if (isInitialized) {
      console.log('Stockage déjà initialisé');
      return;
    }
    
    console.log('Initialisation du stockage...');
    
    try {
      await Promise.all([
        loadProjectsFromStorage(),
        loadFavoritesFromStorage(),
        loadQuickCalcHistoryFromStorage() // NOUVEAU
      ]);
      
      isInitialized = true;
      console.log('Stockage initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du stockage:', error);
      throw error;
    }
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    console.log('getProjects appelé');
    
    // S'assurer que les données sont chargées
    await loadProjectsFromStorage();
    
    console.log('Retour de', projects.length, 'projets');
    return [...projects]; // Retourner une copie pour éviter les mutations
  },

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'buildings'>): Promise<Project> {
    await loadProjectsFromStorage();
    
    const project: Project = {
      ...projectData,
      id: generateUniqueId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      buildings: []
    };
    
    projects.push(project);
    await saveProjects();
    console.log('Projet créé:', project.name);
    return project;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    await loadProjectsFromStorage();
    
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    projects[index] = { ...projects[index], ...updates, updatedAt: new Date() };
    await saveProjects();
    return projects[index];
  },

  async deleteProject(id: string): Promise<boolean> {
    await loadProjectsFromStorage();
    
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    projects.splice(index, 1);
    
    // Supprimer des favoris
    favoriteProjects = favoriteProjects.filter(fId => fId !== id);
    
    await Promise.all([saveProjects(), saveFavorites()]);
    return true;
  },

  // Favorites - Projects
  async getFavoriteProjects(): Promise<string[]> {
    await loadFavoritesFromStorage();
    return [...favoriteProjects];
  },

  async setFavoriteProjects(favorites: string[]): Promise<void> {
    favoriteProjects = [...favorites];
    await AsyncStorage.setItem(FAVORITE_PROJECTS_KEY, JSON.stringify(favoriteProjects));
  },

  // Favorites - Buildings
  async getFavoriteBuildings(): Promise<string[]> {
    await loadFavoritesFromStorage();
    return [...favoriteBuildings];
  },

  async setFavoriteBuildings(favorites: string[]): Promise<void> {
    favoriteBuildings = [...favorites];
    await AsyncStorage.setItem(FAVORITE_BUILDINGS_KEY, JSON.stringify(favoriteBuildings));
  },

  // Favorites - Zones
  async getFavoriteZones(): Promise<string[]> {
    await loadFavoritesFromStorage();
    return [...favoriteZones];
  },

  async setFavoriteZones(favorites: string[]): Promise<void> {
    favoriteZones = [...favorites];
    await AsyncStorage.setItem(FAVORITE_ZONES_KEY, JSON.stringify(favoriteZones));
  },

  // Favorites - Shutters
  async getFavoriteShutters(): Promise<string[]> {
    await loadFavoritesFromStorage();
    return [...favoriteShutters];
  },

  async setFavoriteShutters(favorites: string[]): Promise<void> {
    favoriteShutters = [...favorites];
    await AsyncStorage.setItem(FAVORITE_SHUTTERS_KEY, JSON.stringify(favoriteShutters));
  },

  // NOUVEAU : Gestion de l'historique des calculs rapides
  async getQuickCalcHistory(): Promise<QuickCalcHistoryItem[]> {
    await loadQuickCalcHistoryFromStorage();
    return [...quickCalcHistory];
  },

  async addQuickCalcHistory(item: Omit<QuickCalcHistoryItem, 'id' | 'timestamp'>): Promise<void> {
    await loadQuickCalcHistoryFromStorage();
    
    const newItem: QuickCalcHistoryItem = {
      ...item,
      id: generateUniqueId(),
      timestamp: new Date()
    };
    
    // Ajouter au début de la liste
    quickCalcHistory.unshift(newItem);
    
    // Garder seulement les 5 derniers
    quickCalcHistory = quickCalcHistory.slice(0, 5);
    
    await saveQuickCalcHistory();
  },

  async clearQuickCalcHistory(): Promise<void> {
    quickCalcHistory = [];
    await saveQuickCalcHistory();
  },

  // Buildings
  async createBuilding(projectId: string, buildingData: Omit<Building, 'id' | 'projectId' | 'createdAt' | 'functionalZones'>): Promise<Building | null> {
    await loadProjectsFromStorage();
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const building: Building = {
      ...buildingData,
      id: generateUniqueId(),
      projectId,
      createdAt: new Date(),
      functionalZones: []
    };

    project.buildings.push(building);
    await saveProjects();
    return building;
  },

  async updateBuilding(buildingId: string, updates: Partial<Building>): Promise<Building | null> {
    await loadProjectsFromStorage();
    
    for (const project of projects) {
      const buildingIndex = project.buildings.findIndex(b => b.id === buildingId);
      if (buildingIndex !== -1) {
        project.buildings[buildingIndex] = { ...project.buildings[buildingIndex], ...updates };
        await saveProjects();
        return project.buildings[buildingIndex];
      }
    }
    return null;
  },

  async deleteBuilding(buildingId: string): Promise<boolean> {
    await loadProjectsFromStorage();
    
    for (const project of projects) {
      const buildingIndex = project.buildings.findIndex(b => b.id === buildingId);
      if (buildingIndex !== -1) {
        project.buildings.splice(buildingIndex, 1);
        
        // Supprimer des favoris
        favoriteBuildings = favoriteBuildings.filter(fId => fId !== buildingId);
        
        await Promise.all([saveProjects(), saveFavorites()]);
        return true;
      }
    }
    return false;
  },

  // Functional Zones
  async createFunctionalZone(buildingId: string, zoneData: Omit<FunctionalZone, 'id' | 'buildingId' | 'createdAt' | 'shutters'>): Promise<FunctionalZone | null> {
    await loadProjectsFromStorage();
    
    for (const project of projects) {
      const building = project.buildings.find(b => b.id === buildingId);
      if (building) {
        const zone: FunctionalZone = {
          ...zoneData,
          id: generateUniqueId(),
          buildingId,
          createdAt: new Date(),
          shutters: []
        };
        building.functionalZones.push(zone);
        await saveProjects();
        return zone;
      }
    }
    return null;
  },

  async updateFunctionalZone(zoneId: string, updates: Partial<FunctionalZone>): Promise<FunctionalZone | null> {
    await loadProjectsFromStorage();
    
    for (const project of projects) {
      for (const building of project.buildings) {
        const zoneIndex = building.functionalZones.findIndex(z => z.id === zoneId);
        if (zoneIndex !== -1) {
          building.functionalZones[zoneIndex] = { ...building.functionalZones[zoneIndex], ...updates };
          await saveProjects();
          return building.functionalZones[zoneIndex];
        }
      }
    }
    return null;
  },

  async deleteFunctionalZone(zoneId: string): Promise<boolean> {
    await loadProjectsFromStorage();
    
    for (const project of projects) {
      for (const building of project.buildings) {
        const zoneIndex = building.functionalZones.findIndex(z => z.id === zoneId);
        if (zoneIndex !== -1) {
          building.functionalZones.splice(zoneIndex, 1);
          
          // Supprimer des favoris
          favoriteZones = favoriteZones.filter(fId => fId !== zoneId);
          
          await Promise.all([saveProjects(), saveFavorites()]);
          return true;
        }
      }
    }
    return false;
  },

  // Shutters
  async createShutter(zoneId: string, shutterData: Omit<Shutter, 'id' | 'zoneId' | 'createdAt' | 'updatedAt'>): Promise<Shutter | null> {
    await loadProjectsFromStorage();
    
    for (const project of projects) {
      for (const building of project.buildings) {
        const zone = building.functionalZones.find(z => z.id === zoneId);
        if (zone) {
          const shutter: Shutter = {
            ...shutterData,
            id: generateUniqueId(),
            zoneId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          zone.shutters.push(shutter);
          await saveProjects();
          return shutter;
        }
      }
    }
    return null;
  },

  async updateShutter(shutterId: string, updates: Partial<Shutter>): Promise<Shutter | null> {
    await loadProjectsFromStorage();
    
    for (const project of projects) {
      for (const building of project.buildings) {
        for (const zone of building.functionalZones) {
          const shutterIndex = zone.shutters.findIndex(s => s.id === shutterId);
          if (shutterIndex !== -1) {
            zone.shutters[shutterIndex] = { ...zone.shutters[shutterIndex], ...updates, updatedAt: new Date() };
            await saveProjects();
            return zone.shutters[shutterIndex];
          }
        }
      }
    }
    return null;
  },

  async deleteShutter(shutterId: string): Promise<boolean> {
    await loadProjectsFromStorage();
    
    for (const project of projects) {
      for (const building of project.buildings) {
        for (const zone of building.functionalZones) {
          const shutterIndex = zone.shutters.findIndex(s => s.id === shutterId);
          if (shutterIndex !== -1) {
            zone.shutters.splice(shutterIndex, 1);
            
            // Supprimer des favoris
            favoriteShutters = favoriteShutters.filter(fId => fId !== shutterId);
            
            await Promise.all([saveProjects(), saveFavorites()]);
            return true;
          }
        }
      }
    }
    return false;
  },

  // NOUVELLE FONCTION DE RECHERCHE AMÉLIORÉE
  async searchShutters(query: string): Promise<SearchResult[]> {
    await loadProjectsFromStorage();
    
    const results: SearchResult[] = [];
    
    // Nettoyer et diviser la requête en mots-clés
    const queryWords = query.toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    console.log('Recherche avec les mots-clés:', queryWords);

    for (const project of projects) {
      for (const building of project.buildings) {
        for (const zone of building.functionalZones) {
          for (const shutter of zone.shutters) {
            // Créer un texte de recherche complet pour chaque volet
            const searchableText = [
              shutter.name,
              zone.name,
              building.name,
              project.name,
              project.city || '',
              shutter.remarks || ''
            ].join(' ').toLowerCase();
            
            // Vérifier si TOUS les mots-clés sont présents dans le texte
            const matchesAllWords = queryWords.every(word => 
              searchableText.includes(word)
            );
            
            if (matchesAllWords) {
              results.push({ shutter, zone, building, project });
            }
          }
        }
      }
    }

    console.log(`Recherche terminée: ${results.length} résultats trouvés`);
    return results;
  },

  // Utilitaires de maintenance
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        PROJECTS_KEY,
        FAVORITE_PROJECTS_KEY,
        FAVORITE_BUILDINGS_KEY,
        FAVORITE_ZONES_KEY,
        FAVORITE_SHUTTERS_KEY,
        QUICK_CALC_HISTORY_KEY // NOUVEAU
      ]);
      
      // Réinitialiser le cache
      projects = [];
      favoriteProjects = [];
      favoriteBuildings = [];
      favoriteZones = [];
      favoriteShutters = [];
      quickCalcHistory = []; // NOUVEAU
      isProjectsLoaded = false;
      isFavoritesLoaded = false;
      isQuickCalcHistoryLoaded = false; // NOUVEAU
      isInitialized = false;
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
    }
  },

  async getStorageInfo(): Promise<{
    projectsCount: number;
    totalShutters: number;
    storageSize: string;
  }> {
    await loadProjectsFromStorage();
    
    const totalShutters = projects.reduce((total, project) => 
      total + project.buildings.reduce((buildingTotal, building) => 
        buildingTotal + building.functionalZones.reduce((zoneTotal, zone) => 
          zoneTotal + zone.shutters.length, 0), 0), 0);

    const dataString = JSON.stringify(projects);
    const storageSize = `${(dataString.length / 1024).toFixed(2)} KB`;

    return {
      projectsCount: projects.length,
      totalShutters,
      storageSize
    };
  }
};