import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { router } from 'expo-router';
import { Search as SearchIcon, ChevronDown, ChevronRight, Building, Wind, X, Filter, Layers, Target } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { ComplianceIndicator } from '@/components/ComplianceIndicator';
import { SearchResult, Project, Building as BuildingType, FunctionalZone } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { calculateCompliance, formatDeviation } from '@/utils/compliance';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingScreen } from '@/components/LoadingScreen';

type SearchMode = 'simple' | 'hierarchical';
type ShutterTypeFilter = 'all' | 'high' | 'low';
type ComplianceFilterType = 'all' | 'compliant' | 'acceptable' | 'non-compliant';

interface HierarchicalFilter {
  projectId?: string;
  buildingId?: string;
  zoneId?: string;
  shutterType?: ShutterTypeFilter;
  complianceType?: ComplianceFilterType;
}

export default function SearchScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { projects, searchShutters } = useStorage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  
  const [hierarchicalFilter, setHierarchicalFilter] = useState<HierarchicalFilter>({});
  const [expandedSections, setExpandedSections] = useState<{
    projects: boolean;
    buildings: boolean;
    zones: boolean;
  }>({
    projects: false,
    buildings: false,
    zones: false
  });

  // Animation de fondu à l'entrée de la page
  useFocusEffect(
    useCallback(() => {
      console.log('Search screen focused, animating...');
      
      // Animation de fondu à l'entrée
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  useEffect(() => {
    if (searchMode === 'simple' && query.trim().length >= 2) {
      performSearch();
    } else if (searchMode === 'hierarchical') {
      searchWithHierarchy();
    } else {
      setResults([]);
    }
  }, [query, searchMode, hierarchicalFilter, projects]);

  const performSearch = async () => {
    setLoading(true);
    try {
      console.log('Recherche simple avec la requête:', query.trim());
      const searchResults = searchShutters(query.trim());
      console.log('Résultats trouvés:', searchResults.length);
      setResults(searchResults);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchWithHierarchy = async () => {
    setLoading(true);
    try {
      let filteredResults: SearchResult[] = [];
      
      for (const project of projects) {
        if (hierarchicalFilter.projectId && project.id !== hierarchicalFilter.projectId) {
          continue;
        }

        for (const building of project.buildings) {
          if (hierarchicalFilter.buildingId && building.id !== hierarchicalFilter.buildingId) {
            continue;
          }

          for (const zone of building.functionalZones) {
            if (hierarchicalFilter.zoneId && zone.id !== hierarchicalFilter.zoneId) {
              continue;
            }

            for (const shutter of zone.shutters) {
              // Filtre par type de volet
              if (hierarchicalFilter.shutterType && hierarchicalFilter.shutterType !== 'all') {
                if (shutter.type !== hierarchicalFilter.shutterType) {
                  continue;
                }
              }

              // Filtre par niveau de conformité
              if (hierarchicalFilter.complianceType && hierarchicalFilter.complianceType !== 'all') {
                const compliance = calculateCompliance(shutter.referenceFlow, shutter.measuredFlow);
                if (compliance.status !== hierarchicalFilter.complianceType) {
                  continue;
                }
              }

              if (query.trim().length >= 2) {
                const queryWords = query.trim().toLowerCase().split(/\s+/).filter(word => word.length > 0);
                const searchableText = [
                  shutter.name,
                  zone.name,
                  building.name,
                  project.name,
                  project.city || '',
                  shutter.remarks || ''
                ].join(' ').toLowerCase();
                
                const matchesSearch = queryWords.every(word => searchableText.includes(word));
                
                if (matchesSearch) {
                  filteredResults.push({ shutter, zone, building, project });
                }
              } else {
                filteredResults.push({ shutter, zone, building, project });
              }
            }
          }
        }
      }

      setResults(filteredResults);
    } catch (error) {
      console.error('Erreur lors de la recherche hiérarchique:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShutterPress = (result: SearchResult) => {
    router.push(`/(tabs)/shutter/${result.shutter.id}?from=search`);
  };

  const toggleSearchMode = () => {
    const newMode = searchMode === 'simple' ? 'hierarchical' : 'simple';
    setSearchMode(newMode);
    setQuery('');
    setResults([]);
    setHierarchicalFilter({});
    setExpandedSections({
      projects: false,
      buildings: false,
      zones: false
    });
  };

  const clearHierarchicalFilter = () => {
    setHierarchicalFilter({});
    setExpandedSections({
      projects: false,
      buildings: false,
      zones: false
    });
    setResults([]);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      projects: section === 'projects' ? !prev.projects : false,
      buildings: section === 'buildings' ? !prev.buildings : false,
      zones: section === 'zones' ? !prev.zones : false
    }));
  };

  const getSelectedProject = () => {
    return projects.find(p => p.id === hierarchicalFilter.projectId);
  };

  const getSelectedBuilding = () => {
    const project = getSelectedProject();
    return project?.buildings.find(b => b.id === hierarchicalFilter.buildingId);
  };

  const getSelectedZone = () => {
    const building = getSelectedBuilding();
    return building?.functionalZones.find(z => z.id === hierarchicalFilter.zoneId);
  };

  const getZoneShutterStats = () => {
    const zone = getSelectedZone();
    if (!zone) return { high: 0, low: 0, total: 0 };
    
    const high = zone.shutters.filter(s => s.type === 'high').length;
    const low = zone.shutters.filter(s => s.type === 'low').length;
    const total = zone.shutters.length;
    
    return { high, low, total };
  };

  // Obtenir les statistiques de conformité
  const getComplianceStats = () => {
    const zone = getSelectedZone();
    if (!zone) return { compliant: 0, acceptable: 0, nonCompliant: 0 };
    
    let compliant = 0;
    let acceptable = 0;
    let nonCompliant = 0;
    
    zone.shutters.forEach(shutter => {
      const compliance = calculateCompliance(shutter.referenceFlow, shutter.measuredFlow);
      switch (compliance.status) {
        case 'compliant':
          compliant++;
          break;
        case 'acceptable':
          acceptable++;
          break;
        case 'non-compliant':
          nonCompliant++;
          break;
      }
    });
    
    return { compliant, acceptable, nonCompliant };
  };

  const renderModeSelector = () => (
    <View style={styles.modeSelectorContainer}>
      <Text style={styles.modeSelectorTitle}>Mode de recherche</Text>
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeOption,
            searchMode === 'simple' && styles.modeOptionActive
          ]}
          onPress={() => searchMode !== 'simple' && toggleSearchMode()}
        >
          <SearchIcon size={16} color={searchMode === 'simple' ? '#ffffff' : theme.colors.primary} />
          <Text style={[
            styles.modeOptionText,
            searchMode === 'simple' && styles.modeOptionTextActive
          ]}>
            {strings.simpleSearch}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeOption,
            searchMode === 'hierarchical' && styles.modeOptionActive
          ]}
          onPress={() => searchMode !== 'hierarchical' && toggleSearchMode()}
        >
          <Layers size={16} color={searchMode === 'hierarchical' ? '#ffffff' : theme.colors.primary} />
          <Text style={[
            styles.modeOptionText,
            searchMode === 'hierarchical' && styles.modeOptionTextActive
          ]}>
            {strings.hierarchicalSearch}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.modeDescription}>
        {searchMode === 'simple' 
          ? 'Recherchez avec un ou plusieurs mots-clés'
          : 'Filtrez d\'abord par projet, bâtiment et zone'
        }
      </Text>
    </View>
  );

  const renderHierarchicalFilters = () => {
    const selectedProject = getSelectedProject();
    const selectedBuilding = getSelectedBuilding();
    const selectedZone = getSelectedZone();
    const shutterStats = getZoneShutterStats();
    const complianceStats = getComplianceStats();

    return (
      <View style={styles.hierarchicalContainer}>
        <View style={styles.hierarchicalHeader}>
          <Target size={20} color={theme.colors.primary} />
          <Text style={styles.hierarchicalTitle}>Filtres hiérarchiques</Text>
          {(hierarchicalFilter.projectId || hierarchicalFilter.buildingId || hierarchicalFilter.zoneId || hierarchicalFilter.shutterType || hierarchicalFilter.complianceType) && (
            <TouchableOpacity style={styles.clearAllButton} onPress={clearHierarchicalFilter}>
              <X size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={[
                styles.filterHeader,
                selectedProject && styles.filterHeaderSelected
              ]}
              onPress={() => toggleSection('projects')}
            >
              <View style={styles.filterHeaderContent}>
                <Building size={16} color={selectedProject ? theme.colors.primary : theme.colors.textSecondary} />
                <Text style={[
                  styles.filterHeaderText,
                  selectedProject && styles.filterHeaderTextSelected
                ]} numberOfLines={1} ellipsizeMode="tail">
                  {selectedProject ? selectedProject.name : 'Sélectionner un projet'}
                </Text>
                {expandedSections.projects ? (
                  <ChevronDown size={16} color={theme.colors.textSecondary} />
                ) : (
                  <ChevronRight size={16} color={theme.colors.textSecondary} />
                )}
              </View>
            </TouchableOpacity>

            {expandedSections.projects && (
              <ScrollView style={styles.filterOptions} nestedScrollEnabled={true}>
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.filterOption,
                      hierarchicalFilter.projectId === project.id && styles.filterOptionSelected
                    ]}
                    onPress={() => {
                      setHierarchicalFilter({
                        projectId: project.id
                      });
                      setExpandedSections({ projects: false, buildings: false, zones: false });
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      hierarchicalFilter.projectId === project.id && styles.filterOptionTextSelected
                    ]} numberOfLines={1} ellipsizeMode="tail">
                      {project.name}
                    </Text>
                    {project.city && (
                      <Text style={styles.filterOptionSubtext} numberOfLines={1} ellipsizeMode="tail">
                        {project.city}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.filterSection}>
            <TouchableOpacity
              style={[
                styles.filterHeader,
                selectedBuilding && styles.filterHeaderSelected,
                !selectedProject && styles.filterHeaderDisabled
              ]}
              onPress={() => selectedProject && toggleSection('buildings')}
              disabled={!selectedProject}
            >
              <View style={styles.filterHeaderContent}>
                <Building size={16} color={selectedBuilding ? theme.colors.primary : theme.colors.textSecondary} />
                <Text style={[
                  styles.filterHeaderText,
                  selectedBuilding && styles.filterHeaderTextSelected,
                  !selectedProject && styles.filterHeaderTextDisabled
                ]} numberOfLines={1} ellipsizeMode="tail">
                  {selectedBuilding ? selectedBuilding.name : 'Sélectionner un bâtiment'}
                </Text>
                {selectedProject && (expandedSections.buildings ? (
                  <ChevronDown size={16} color={theme.colors.textSecondary} />
                ) : (
                  <ChevronRight size={16} color={theme.colors.textSecondary} />
                ))}
              </View>
            </TouchableOpacity>

            {expandedSections.buildings && selectedProject && (
              <ScrollView style={styles.filterOptions} nestedScrollEnabled={true}>
                {selectedProject.buildings.map((building) => (
                  <TouchableOpacity
                    key={building.id}
                    style={[
                      styles.filterOption,
                      hierarchicalFilter.buildingId === building.id && styles.filterOptionSelected
                    ]}
                    onPress={() => {
                      setHierarchicalFilter(prev => ({
                        ...prev,
                        buildingId: building.id,
                        zoneId: undefined,
                        shutterType: undefined,
                        complianceType: undefined
                      }));
                      setExpandedSections({ projects: false, buildings: false, zones: false });
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      hierarchicalFilter.buildingId === building.id && styles.filterOptionTextSelected
                    ]} numberOfLines={1} ellipsizeMode="tail">
                      {building.name}
                    </Text>
                    {building.description && (
                      <Text style={styles.filterOptionSubtext} numberOfLines={1} ellipsizeMode="tail">
                        {building.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.filterSection}>
            <TouchableOpacity
              style={[
                styles.filterHeader,
                selectedZone && styles.filterHeaderSelected,
                !selectedBuilding && styles.filterHeaderDisabled
              ]}
              onPress={() => selectedBuilding && toggleSection('zones')}
              disabled={!selectedBuilding}
            >
              <View style={styles.filterHeaderContent}>
                <Wind size={16} color={selectedZone ? theme.colors.primary : theme.colors.textSecondary} />
                <Text style={[
                  styles.filterHeaderText,
                  selectedZone && styles.filterHeaderTextSelected,
                  !selectedBuilding && styles.filterHeaderTextDisabled
                ]} numberOfLines={1} ellipsizeMode="tail">
                  {selectedZone ? selectedZone.name : 'Sélectionner une zone'}
                </Text>
                {selectedBuilding && (expandedSections.zones ? (
                  <ChevronDown size={16} color={theme.colors.textSecondary} />
                ) : (
                  <ChevronRight size={16} color={theme.colors.textSecondary} />
                ))}
              </View>
            </TouchableOpacity>

            {expandedSections.zones && selectedBuilding && (
              <ScrollView style={styles.filterOptions} nestedScrollEnabled={true}>
                {selectedBuilding.functionalZones.map((zone) => (
                  <TouchableOpacity
                    key={zone.id}
                    style={[
                      styles.filterOption,
                      hierarchicalFilter.zoneId === zone.id && styles.filterOptionSelected
                    ]}
                    onPress={() => {
                      setHierarchicalFilter(prev => ({
                        ...prev,
                        zoneId: zone.id,
                        shutterType: 'all',
                        complianceType: 'all'
                      }));
                      setExpandedSections({ projects: false, buildings: false, zones: false });
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      hierarchicalFilter.zoneId === zone.id && styles.filterOptionTextSelected
                    ]} numberOfLines={1} ellipsizeMode="tail">
                      {zone.name}
                    </Text>
                    {zone.description && (
                      <Text style={styles.filterOptionSubtext} numberOfLines={1} ellipsizeMode="tail">
                        {zone.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {selectedZone && (
            <>
              {/* Filtre par type de volet */}
              <View style={styles.shutterTypeFilterSection}>
                <Text style={styles.shutterTypeFilterTitle}>🔲 Type de volet</Text>
                <View style={styles.shutterTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.shutterTypeButton,
                      (!hierarchicalFilter.shutterType || hierarchicalFilter.shutterType === 'all') && styles.shutterTypeButtonActive
                    ]}
                    onPress={() => setHierarchicalFilter(prev => ({ ...prev, shutterType: 'all' }))}
                  >
                    <Text style={[
                      styles.shutterTypeButtonText,
                      (!hierarchicalFilter.shutterType || hierarchicalFilter.shutterType === 'all') && styles.shutterTypeButtonTextActive
                    ]}>
                      Tous ({shutterStats.total})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.shutterTypeButton,
                      hierarchicalFilter.shutterType === 'high' && styles.shutterTypeButtonActive
                    ]}
                    onPress={() => setHierarchicalFilter(prev => ({ ...prev, shutterType: 'high' }))}
                  >
                    <View style={styles.shutterTypeButtonContent}>
                      <View style={[styles.shutterTypeIndicator, { backgroundColor: '#10B981' }]} />
                      <Text style={[
                        styles.shutterTypeButtonText,
                        hierarchicalFilter.shutterType === 'high' && styles.shutterTypeButtonTextActive
                      ]}>
                        VH ({shutterStats.high})
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.shutterTypeButton,
                      hierarchicalFilter.shutterType === 'low' && styles.shutterTypeButtonActive
                    ]}
                    onPress={() => setHierarchicalFilter(prev => ({ ...prev, shutterType: 'low' }))}
                  >
                    <View style={styles.shutterTypeButtonContent}>
                      <View style={[styles.shutterTypeIndicator, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[
                        styles.shutterTypeButtonText,
                        hierarchicalFilter.shutterType === 'low' && styles.shutterTypeButtonTextActive
                      ]}>
                        VB ({shutterStats.low})
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filtre par niveau de conformité - HORIZONTAL avec points colorés uniquement */}
              <View style={styles.complianceFilterSection}>
                <Text style={styles.complianceFilterTitle}>📊 Niveau de conformité</Text>
                <View style={styles.complianceFilterButtons}>
                  <TouchableOpacity
                    style={[
                      styles.complianceFilterButton,
                      (!hierarchicalFilter.complianceType || hierarchicalFilter.complianceType === 'all') && styles.complianceFilterButtonActive
                    ]}
                    onPress={() => setHierarchicalFilter(prev => ({ ...prev, complianceType: 'all' }))}
                  >
                    <Text style={[
                      styles.complianceFilterButtonText,
                      (!hierarchicalFilter.complianceType || hierarchicalFilter.complianceType === 'all') && styles.complianceFilterButtonTextActive
                    ]}>
                      Tous ({shutterStats.total})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.complianceFilterButton,
                      hierarchicalFilter.complianceType === 'compliant' && styles.complianceFilterButtonActive
                    ]}
                    onPress={() => setHierarchicalFilter(prev => ({ ...prev, complianceType: 'compliant' }))}
                  >
                    <View style={[styles.complianceDot, { backgroundColor: '#10B981' }]} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.complianceFilterButton,
                      hierarchicalFilter.complianceType === 'acceptable' && styles.complianceFilterButtonActive
                    ]}
                    onPress={() => setHierarchicalFilter(prev => ({ ...prev, complianceType: 'acceptable' }))}
                  >
                    <View style={[styles.complianceDot, { backgroundColor: '#F59E0B' }]} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.complianceFilterButton,
                      hierarchicalFilter.complianceType === 'non-compliant' && styles.complianceFilterButtonActive
                    ]}
                    onPress={() => setHierarchicalFilter(prev => ({ ...prev, complianceType: 'non-compliant' }))}
                  >
                    <View style={[styles.complianceDot, { backgroundColor: '#EF4444' }]} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    const compliance = calculateCompliance(item.shutter.referenceFlow, item.shutter.measuredFlow);

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => handleShutterPress(item)}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.shutterName}>{item.shutter.name}</Text>
          <Text style={styles.shutterType}>
            {item.shutter.type === 'high' ? strings.shutterHigh : strings.shutterLow}
          </Text>
        </View>

        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>
            {item.project.name} → {item.building.name} → {item.zone.name}
          </Text>
        </View>

        <View style={styles.flowData}>
          <View style={styles.flowItem}>
            <Text style={styles.flowLabel}>{strings.referenceFlow}</Text>
            <Text style={styles.flowValue}>{item.shutter.referenceFlow.toFixed(0)} {strings.cubicMeterPerHour}</Text>
          </View>
          <View style={styles.flowItem}>
            <Text style={styles.flowLabel}>{strings.measuredFlow}</Text>
            <Text style={styles.flowValue}>{item.shutter.measuredFlow.toFixed(0)} {strings.cubicMeterPerHour}</Text>
          </View>
          <View style={styles.flowItem}>
            <Text style={styles.flowLabel}>{strings.deviation}</Text>
            <Text style={[styles.flowValue, { color: compliance.color }]}>
              {formatDeviation(compliance.deviation)}
            </Text>
          </View>
        </View>

        <View style={styles.resultFooter}>
          <ComplianceIndicator compliance={compliance} size="small" />
          {item.shutter.remarks && (
            <Text style={styles.remarks} numberOfLines={1}>
              {item.shutter.remarks}
            </Text>
          )}
        </View>
        </TouchableOpacity>
    );
  };

  const getSearchPlaceholder = () => {
    if (searchMode === 'simple') {
      return 'Rechercher un volet...';
    } else {
      return strings.searchInSelected;
    }
  };

  const getEmptyStateText = () => {
    if (searchMode === 'simple') {
      return query.length >= 2 ? strings.noResultsDesc : strings.searchMinChars;
    } else {
      if (!hierarchicalFilter.projectId) {
        return 'Sélectionnez un projet pour commencer la recherche';
      } else if (query.length > 0 && query.length < 2) {
        return strings.searchMinChars;
      } else {
        return strings.noResultsDesc;
      }
    }
  };

  const getScopeDescription = () => {
    if (searchMode === 'simple') return 'Dans tous vos projets';
    
    if (hierarchicalFilter.zoneId) {
      const zone = getSelectedZone();
      let scope = `Dans la zone "${zone?.name}"`;
      
      if (hierarchicalFilter.shutterType && hierarchicalFilter.shutterType !== 'all') {
        const typeLabel = hierarchicalFilter.shutterType === 'high' ? 'volets hauts' : 'volets bas';
        scope += ` (${typeLabel}`;
        
        if (hierarchicalFilter.complianceType && hierarchicalFilter.complianceType !== 'all') {
          const complianceLabel = 
            hierarchicalFilter.complianceType === 'compliant' ? 'fonctionnels' :
            hierarchicalFilter.complianceType === 'acceptable' ? 'acceptables' : 'non conformes';
          scope += `, ${complianceLabel}`;
        }
        
        scope += ')';
      } else if (hierarchicalFilter.complianceType && hierarchicalFilter.complianceType !== 'all') {
        const complianceLabel = 
          hierarchicalFilter.complianceType === 'compliant' ? 'fonctionnels' :
          hierarchicalFilter.complianceType === 'acceptable' ? 'acceptables' : 'non conformes';
        scope += ` (volets ${complianceLabel})`;
      }
      
      return scope;
    } else if (hierarchicalFilter.buildingId) {
      const building = getSelectedBuilding();
      return `Dans le bâtiment "${building?.name}"`;
    } else if (hierarchicalFilter.projectId) {
      const project = getSelectedProject();
      return `Dans le projet "${project?.name}"`;
    }
    return 'Sélectionnez un projet';
  };

  const styles = createStyles(theme);

  // Si l'écran est en cours de chargement, afficher un écran de chargement
  if (loading) {
    return <LoadingScreen title={strings.searchTitle} message={strings.searching} />;
  }

  return (
    <View style={styles.container}>
      <Header 
        title={strings.searchTitle} 
        subtitle={strings.searchSubtitle}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={Platform.OS === 'web' ? styles.contentContainerWeb : undefined}
        showsVerticalScrollIndicator={false}
      >
        {renderModeSelector()}

        {searchMode === 'hierarchical' && renderHierarchicalFilters()}

        <View style={styles.searchContainer}>
          <Input
            placeholder={getSearchPlaceholder()}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
          
          <View style={styles.scopeIndicator}>
            <Text style={styles.scopeLabel}>{strings.searchScope}:</Text>
            <Text style={styles.scopeValue}>{getScopeDescription()}</Text>
          </View>
        </View>

        {(searchMode === 'simple' && query.length > 0 && query.length < 2) || 
         (searchMode === 'hierarchical' && !hierarchicalFilter.projectId) ? (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              {getEmptyStateText()}
            </Text>
          </View>
        ) : (
          <>
            {loading ? (
              <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
                <Text style={styles.loadingText}>{strings.searching}</Text>
              </Animated.View>
            ) : results.length === 0 && (
              (searchMode === 'simple' && query.length >= 2) || 
              (searchMode === 'hierarchical' && hierarchicalFilter.projectId)
            ) ? (
              <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
                <SearchIcon size={48} color={theme.colors.textTertiary} />
                <Text style={styles.emptyTitle}>{strings.noResults}</Text>
                <Text style={styles.emptySubtitle}>
                  {getEmptyStateText()}
                </Text>
              </Animated.View>
            ) : results.length > 0 ? (
              <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsCount}>
                    {results.length} {strings.searchResults}
                  </Text>
                  <View style={styles.resultsBadge}>
                    <Text style={styles.resultsBadgeText}>
                      {results.length}
                    </Text>
                  </View>
                </View>
                <FlatList
                  data={results}
                  renderItem={renderResult}
                  keyExtractor={(item) => item.shutter.id}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                />
              </Animated.View>
            ) : (
              <Animated.View style={[styles.initialStateContainer, { opacity: fadeAnim }]}>
                <SearchIcon size={64} color={theme.colors.textTertiary} />
                <Text style={styles.initialStateTitle}>Recherchez des volets</Text>
                <Text style={styles.initialStateSubtitle}>
                  Utilisez la barre de recherche ci-dessus pour trouver des volets par nom, zone, bâtiment ou projet
                </Text>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainerWeb: {
    paddingBottom: Platform.OS === 'web' ? 100 : 0,
  },
  modeSelectorContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modeSelectorTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modeOptionActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modeOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  modeOptionTextActive: {
    color: '#ffffff',
  },
  modeDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  hierarchicalContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    padding: 16,
  },
  hierarchicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  hierarchicalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    flex: 1,
  },
  clearAllButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.error + '20',
  },
  filtersContainer: {
    gap: 12,
  },
  filterSection: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  filterHeaderSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  filterHeaderDisabled: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.6,
  },
  filterHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterHeaderText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  filterHeaderTextSelected: {
    color: theme.colors.primary,
  },
  filterHeaderTextDisabled: {
    color: theme.colors.textTertiary,
  },
  filterOptions: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    maxHeight: 150,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  filterOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  filterOptionTextSelected: {
    color: theme.colors.primary,
  },
  filterOptionSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  shutterTypeFilterSection: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  shutterTypeFilterTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  shutterTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shutterTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterTypeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  shutterTypeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shutterTypeButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  shutterTypeButtonTextActive: {
    color: '#ffffff',
  },
  shutterTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Styles pour le filtre de conformité - HORIZONTAL avec points uniquement
  complianceFilterSection: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 12,
  },
  complianceFilterTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  complianceFilterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  complianceFilterButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceFilterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  complianceFilterButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  complianceFilterButtonTextActive: {
    color: '#ffffff',
  },
  // Point coloré pour le filtre de conformité
  complianceDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  searchContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    marginBottom: 8,
  },
  scopeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  scopeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
  },
  scopeValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.primary,
    flex: 1,
  },
  hintContainer: {
    padding: 32,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  initialStateContainer: {
    padding: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialStateTitle: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  initialStateSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  resultsContainer: {
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  resultsBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  resultsBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shutterName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    flex: 1,
  },
  shutterType: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  breadcrumb: {
    marginBottom: 12,
  },
  breadcrumbText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.primary,
  },
  flowData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  flowItem: {
    flex: 1,
    alignItems: 'center',
  },
  flowLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  flowValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remarks: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 12,
  },
});