import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building, Calendar, Layers, Star, Settings, Trash2 } from 'lucide-react-native';
import { Project } from '@/types';
import { calculateCompliance } from '@/utils/compliance';
import { useTheme } from '@/contexts/ThemeContext';

interface ProjectCardProps {
  project: Project;
  isFavorite: boolean;
  isSelected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({
  project,
  isFavorite,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  onToggleFavorite,
  onEdit,
  onDelete
}: ProjectCardProps) {
  const { theme } = useTheme();

  const getProjectStats = () => {
    const buildingCount = project.buildings.length;
    const zoneCount = project.buildings.reduce((total, building) => 
      total + (building.functionalZones ? building.functionalZones.length : 0), 0);
    const shutterCount = project.buildings.reduce((total, building) => 
      total + (building.functionalZones ? building.functionalZones.reduce((zoneTotal, zone) => 
        zoneTotal + (zone.shutters ? zone.shutters.length : 0), 0) : 0), 0);

    let compliantCount = 0;
    let acceptableCount = 0;
    let nonCompliantCount = 0;
    let totalMeasuredShutters = 0;

    project.buildings.forEach(building => {
      if (building.functionalZones) {
        building.functionalZones.forEach(zone => {
          if (zone.shutters) {
            zone.shutters.forEach(shutter => {
              if (shutter.referenceFlow > 0) {
                totalMeasuredShutters++;
                const compliance = calculateCompliance(shutter.referenceFlow, shutter.measuredFlow);
                switch (compliance.status) {
                  case 'compliant':
                    compliantCount++;
                    break;
                  case 'acceptable':
                    acceptableCount++;
                    break;
                  case 'non-compliant':
                    nonCompliantCount++;
                    break;
                }
              }
            });
          }
        });
      }
    });

    const complianceRate = totalMeasuredShutters > 0 ? 
      ((compliantCount + acceptableCount) / totalMeasuredShutters) * 100 : 0;

    return {
      buildingCount,
      zoneCount,
      shutterCount,
      compliantCount,
      acceptableCount,
      nonCompliantCount,
      complianceRate,
      totalMeasuredShutters
    };
  };

  const stats = getProjectStats();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={[
        styles.projectCard,
        isSelected && styles.selectedCard,
        isFavorite && styles.favoriteCard
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* En-tête avec nom du projet et actions */}
      <View style={styles.projectHeader}>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.city && <Text style={styles.projectCity}>{project.city}</Text>}
        </View>
        
        {!selectionMode && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onToggleFavorite}
            >
              <Star 
                size={16} 
                color={isFavorite ? "#F59E0B" : theme.colors.textTertiary} 
                fill={isFavorite ? "#F59E0B" : "none"}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onEdit}
            >
              <Settings size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onDelete}
            >
              <Trash2 size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Dates du projet */}
      {(project.startDate || project.endDate) && (
        <View style={styles.projectDates}>
          <Calendar size={14} color={theme.colors.textSecondary} />
          <Text style={styles.dateText}>
            {project.startDate && new Date(project.startDate).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
            {project.startDate && project.endDate && ' → '}
            {project.endDate && new Date(project.endDate).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
        </View>
      )}

      {/* Statistiques principales */}
      <View style={styles.mainStats}>
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Building size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.statNumber}>{stats.buildingCount}</Text>
          <Text style={styles.statLabel}>Bâtiments</Text>
        </View>
        
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Layers size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.statNumber}>{stats.zoneCount}</Text>
          <Text style={styles.statLabel}>Zones</Text>
        </View>
        
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <View style={[styles.complianceDot, { 
              backgroundColor: stats.complianceRate >= 80 ? '#10B981' : stats.complianceRate >= 60 ? '#F59E0B' : '#EF4444' 
            }]} />
          </View>
          <Text style={[styles.statNumber, { 
            color: stats.complianceRate >= 80 ? '#10B981' : stats.complianceRate >= 60 ? '#F59E0B' : '#EF4444' 
          }]}>
            {stats.complianceRate.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Conformité</Text>
        </View>
      </View>

      {/* Barre de progression de conformité */}
      {stats.shutterCount > 0 && (
        <View style={styles.complianceSection}>
          <Text style={styles.shutterCountText}>{stats.shutterCount} volets</Text>
          
          <View style={styles.complianceBar}>
            <View style={[styles.complianceSegment, { 
              flex: stats.compliantCount, 
              backgroundColor: '#10B981' 
            }]} />
            <View style={[styles.complianceSegment, { 
              flex: stats.acceptableCount, 
              backgroundColor: '#F59E0B' 
            }]} />
            <View style={[styles.complianceSegment, { 
              flex: stats.nonCompliantCount, 
              backgroundColor: '#EF4444' 
            }]} />
          </View>

          <View style={styles.complianceLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>{stats.compliantCount} Fonctionnel</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>{stats.acceptableCount} Acceptable</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>{stats.nonCompliantCount} Non conforme</Text>
            </View>
          </View>
        </View>
      )}

      {/* Date de création */}
      <View style={styles.projectFooter}>
        <Text style={styles.createdText}>
          Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  projectCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  favoriteCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  projectCity: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  projectDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  complianceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  complianceSection: {
    marginBottom: 16,
  },
  shutterCountText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  complianceBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
    marginBottom: 12,
  },
  complianceSegment: {
    height: '100%',
  },
  complianceLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  projectFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    alignItems: 'center',
  },
  createdText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textTertiary,
  },
});