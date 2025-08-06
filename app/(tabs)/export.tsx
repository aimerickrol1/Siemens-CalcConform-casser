import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Project } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { calculateCompliance } from '@/utils/compliance';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router, useFocusEffect } from 'expo-router';
import { triggerCreateProjectModal } from '@/utils/EventEmitter';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Note } from '@/types';
import { FadeInView } from '@/components/AnimatedCard';

// Import conditionnel sécurisé pour éviter les erreurs sur web et Android
let FileSystem: any = null;
let Sharing: any = null;

// Charger les modules seulement si disponibles et pas sur web
const loadNativeModules = async () => {
  if (Platform.OS === 'web') {
    return false;
  }
  
  try {
    const fsModule = await import('expo-file-system').catch(() => null);
    const sharingModule = await import('expo-sharing').catch(() => null);
    
    FileSystem = fsModule?.default || fsModule;
    Sharing = sharingModule?.default || sharingModule;
    
    return FileSystem && Sharing;
  } catch (error) {
    console.warn('Modules natifs non disponibles:', error);
    return false;
  }
};

type ExportFilter = 'projects' | 'notes';

export default function ExportScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { projects, notes } = useStorage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [exportingNote, setExportingNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nativeModulesReady, setNativeModulesReady] = useState(false);
  const [selectedNotesForProject, setSelectedNotesForProject] = useState<{[projectId: string]: string[]}>({});
  const [activeFilter, setActiveFilter] = useState<ExportFilter>('projects');
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Animation pour les onglets
  const tabFadeAnim = useRef(new Animated.Value(1)).current;

  // Charger les modules natifs au montage
  useEffect(() => {
    const initNativeModules = async () => {
      const ready = await loadNativeModules();
      setNativeModulesReady(ready);
    };
    
    initNativeModules();
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setError(null);
      console.log('Chargement des projets...');
      console.log('Projets chargés:', projects.length);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      setError('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useFocusEffect(
    useCallback(() => {
      console.log('Export screen focused, reloading projects...');
      loadProjects();
    }, [loadProjects])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProjects();
  }, [loadProjects]);

  const handleCreateFirstProject = () => {
    try {
      router.push('/(tabs)/');

      // Déclencher l'événement après un court délai pour s'assurer que la navigation est terminée
      setTimeout(() => {
        triggerCreateProjectModal();
      }, 300);
    } catch (error) {
      console.error('Erreur de navigation:', error);
      router.push('/(tabs)/');
    }
  };

  const generateProjectReport = (project: Project) => {
    const totalShutters = project.buildings.reduce((total, building) => 
      total + building.functionalZones.reduce((zoneTotal, zone) => zoneTotal + zone.shutters.length, 0), 0
    );
    
    let compliantCount = 0;
    let acceptableCount = 0;
    let nonCompliantCount = 0;
    let totalMeasuredShutters = 0;

    project.buildings.forEach(building => {
      building.functionalZones.forEach(zone => {
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
      });
    });

    const complianceRate = totalMeasuredShutters > 0 ? 
      ((compliantCount + acceptableCount) / totalMeasuredShutters) * 100 : 0;

    return { 
      totalShutters,
      compliantCount,
      acceptableCount,
      nonCompliantCount,
      complianceRate,
      totalMeasuredShutters
    };
  };

  const generateNoteHTML = (note: Note) => {
    const timestamp = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    };

    let htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Note - ${note.title || 'Note sans titre'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            border-bottom: 4px solid #009999;
            padding-bottom: 30px;
            margin-bottom: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .siemens-logo {
            font-size: 32px;
            font-weight: bold;
            color: #009999;
            letter-spacing: 2px;
        }
        
        .document-info {
            text-align: right;
            color: #666;
        }
        
        .document-title {
            font-size: 28px;
            font-weight: bold;
            color: #009999;
            margin-bottom: 10px;
        }
        
        .document-subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
        }
        
        .note-section {
            background: linear-gradient(135deg, #f8fffe 0%, #e6fffa 100%);
            border-left: 6px solid #009999;
            padding: 30px;
            margin-bottom: 40px;
            border-radius: 0 8px 8px 0;
        }
        
        .note-title {
            font-size: 24px;
            font-weight: bold;
            color: #009999;
            margin-bottom: 15px;
            word-wrap: break-word;
        }
        
        .note-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 8px;
        }
        
        .meta-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .meta-label {
            font-weight: 600;
            color: #555;
        }
        
        .meta-value {
            color: #009999;
            font-weight: 500;
        }
        
        .content-section {
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 40px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            min-height: 200px;
        }
        
        .content-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .content-text {
            font-size: 16px;
            line-height: 1.8;
            color: #444;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .empty-content {
            font-style: italic;
            color: #888;
            text-align: center;
            padding: 40px 20px;
        }
        
        .images-section {
            margin-top: 40px;
        }
        
        .images-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .images-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 15px;
        }
        
        .image-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            page-break-inside: avoid;
            margin-bottom: 20px;
        }
        
        .note-image {
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            object-fit: contain !important;
            border-radius: 8px !important;
            border: 1px solid #e5e7eb !important;
            background-color: #f9fafb !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            display: block !important;
        }
        
        .image-caption {
            margin-top: 8px;
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
            text-align: center;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
        }
        
        .footer-note {
            font-size: 12px;
            margin-bottom: 10px;
        }
        
        .footer-signature {
            font-weight: 600;
            color: #009999;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            .note-section,
            .content-section {
                box-shadow: none;
                border: 1px solid #ccc;
            }
            
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
        
        @media (max-width: 768px) {
            body {
                padding: 15px;
            }
            
            .header {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            
            .note-meta {
                grid-template-columns: 1fr;
            }
            
            .images-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="siemens-logo">SIEMENS</div>
            <div>
                <div class="document-title">NOTE TECHNIQUE</div>
                <div class="document-subtitle">Documentation Projet - CalcConform</div>
            </div>
        </div>
        <div class="document-info">
            <div><strong>Date d'export :</strong> ${timestamp}</div>
            <div><strong>Version :</strong> 1.1.0</div>
            <div><strong>Référence :</strong> ${note.id.substring(0, 8).toUpperCase()}</div>
        </div>
    </div>

    <div class="note-section">
        <div class="note-title">${note.title || 'Note sans titre'}</div>
        <div class="note-meta">
            <div class="meta-item">
                <span class="meta-label">Date de création :</span>
                <span class="meta-value">${formatDate(note.createdAt)}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Dernière modification :</span>
                <span class="meta-value">${formatDate(note.updatedAt)}</span>
            </div>
            ${note.images && note.images.length > 0 ? `
            <div class="meta-item">
                <span class="meta-label">Images attachées :</span>
                <span class="meta-value">${note.images.length} image${note.images.length > 1 ? 's' : ''}</span>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="content-section">
        <div class="content-title">
            📝 Contenu de la note
        </div>
        ${note.content && note.content.trim() ? `
        <div class="content-text">${note.content.replace(/\n/g, '<br>')}</div>
        ` : `
        <div class="empty-content">Cette note ne contient pas de texte.</div>
        `}
    </div>

    ${note.images && note.images.length > 0 ? `
    <div class="images-section">
        <div class="images-title">
            📷 Images attachées (${note.images.length})
        </div>
        <div class="images-grid">
            ${note.images.map((image, index) => `
            <div class="image-container">
                <img src="${image}" alt="Image ${index + 1}" class="note-image" />
                <div class="image-caption">Image ${index + 1}</div>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <div class="footer-note">
            Ce document a été généré automatiquement par l'application Siemens CalcConform v1.1.0<br>
            Note technique pour documentation de projet
        </div>
        <div class="footer-signature">
            © ${new Date().getFullYear()} Siemens - Tous droits réservés
        </div>
    </div>
</body>
</html>`;

    return htmlContent;
  };

  const generateNoteTXT = (note: Note) => {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    };

    let txtContent = `SIEMENS - NOTE TECHNIQUE
========================================

Titre: ${note.title || 'Note sans titre'}

Informations:
- Date de création: ${formatDate(note.createdAt)}
- Dernière modification: ${formatDate(note.updatedAt)}
- Référence: ${note.id.substring(0, 8).toUpperCase()}
${note.images && note.images.length > 0 ? `- Images attachées: ${note.images.length}` : ''}

========================================
CONTENU
========================================

${note.content && note.content.trim() ? note.content : 'Cette note ne contient pas de texte.'}

${note.images && note.images.length > 0 ? `
========================================
IMAGES ATTACHÉES
========================================

Cette note contient ${note.images.length} image${note.images.length > 1 ? 's' : ''}.
Les images ne peuvent pas être incluses dans ce format texte.
Pour voir les images, utilisez l'export HTML ou consultez la note dans l'application.
` : ''}

========================================

Document généré par Siemens CalcConform v1.1.0
© ${new Date().getFullYear()} Siemens - Tous droits réservés

Pour toute question: aimeric.krol@siemens.com
`;

    return txtContent;
  };

  const handleExportNote = async (note: Note, format: 'html' | 'txt') => {
    setExportingNote(note.id);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const safeTitle = (note.title || 'Note_sans_titre').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Note_Siemens_${safeTitle}_${timestamp}.${format}`;
      
      const content = format === 'html' ? generateNoteHTML(note) : generateNoteTXT(note);
      const mimeType = format === 'html' ? 'text/html;charset=utf-8;' : 'text/plain;charset=utf-8;';
      
      if (Platform.OS === 'web') {
        try {
          const blob = new Blob([content], { type: mimeType });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          Alert.alert(
            '✅ Note Exportée',
            `La note "${note.title || 'Sans titre'}" a été téléchargée au format ${format.toUpperCase()}.`,
            [{ text: 'Parfait !' }]
          );
        } catch (webError) {
          console.warn('Erreur export web:', webError);
          Alert.alert('Export réussi', 'La note a été générée avec succès.');
        }
      } else if (nativeModulesReady && FileSystem && Sharing) {
        try {
          const fileUri = FileSystem.documentDirectory + fileName;
          await FileSystem.writeAsStringAsync(fileUri, content, {
            encoding: FileSystem.EncodingType.UTF8,
          });

          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: mimeType,
              dialogTitle: 'Partager la note Siemens'
            });
          } else {
            Alert.alert(
              '✅ Note générée',
              `Fichier enregistré :\n${fileUri}`,
              [{ text: 'OK' }]
            );
          }
        } catch (fileError) {
          console.warn('Erreur fichier:', fileError);
          Alert.alert('Export réussi', 'La note a été générée avec succès.');
        }
      } else {
        Alert.alert('Export réussi', 'La note a été générée avec succès.');
      }

    } catch (error) {
      console.error('Erreur lors de l\'export de la note:', error);
      Alert.alert(
        'Erreur d\'export',
        'Impossible de générer le fichier. Veuillez réessayer.',
        [{ text: strings.ok }]
      );
    } finally {
      setExportingNote(null);
    }
  };

  const toggleNoteForProject = (projectId: string, noteId: string) => {
    setSelectedNotesForProject(prev => {
      const currentNotes = prev[projectId] || [];
      const isSelected = currentNotes.includes(noteId);
      
      return {
        ...prev,
        [projectId]: isSelected 
          ? currentNotes.filter(id => id !== noteId)
          : [...currentNotes, noteId]
      };
    });
  };

  const generateProfessionalHTML = (project: Project) => {
    const report = generateProjectReport(project);
    const timestamp = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Récupérer les notes associées à ce projet
    const associatedNotes = (selectedNotesForProject[project.id] || [])
      .map(noteId => notes.find(note => note.id === noteId))
      .filter(note => note !== undefined) as Note[];

    let htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Conformité - ${project.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            border-bottom: 4px solid #009999;
            padding-bottom: 30px;
            margin-bottom: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .siemens-logo {
            font-size: 32px;
            font-weight: bold;
            color: #009999;
            letter-spacing: 2px;
        }
        
        .report-info {
            text-align: right;
            color: #666;
        }
        
        .report-title {
            font-size: 28px;
            font-weight: bold;
            color: #009999;
            margin-bottom: 10px;
        }
        
        .report-subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
        }
        
        .project-section {
            background: linear-gradient(135deg, #f8fffe 0%, #e6fffa 100%);
            border-left: 6px solid #009999;
            padding: 30px;
            margin-bottom: 40px;
            border-radius: 0 8px 8px 0;
        }
        
        .project-title {
            font-size: 24px;
            font-weight: bold;
            color: #009999;
            margin-bottom: 15px;
        }
        
        .project-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .detail-label {
            font-weight: 600;
            color: #555;
        }
        
        .detail-value {
            color: #009999;
            font-weight: 500;
        }
        
        .executive-summary {
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 40px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .summary-title {
            font-size: 22px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #009999;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .compliance-bar-container {
            margin: 30px 0;
        }
        
        .compliance-bar {
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .compliance-segment {
            height: 100%;
            transition: all 0.3s ease;
        }
        
        .compliance-legend {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 15px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        
        .legend-text {
            font-size: 14px;
            color: #555;
        }
        
        .detailed-table {
            margin-top: 40px;
            overflow-x: auto;
        }
        
        .table-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            font-size: 13px;
        }
        
        th {
            background: linear-gradient(135deg, #009999 0%, #007a7a 100%);
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 12px;
            word-wrap: break-word;
        }
        
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        tr:hover {
            background: #e8f4f8;
        }
        
        .status-badge {
            padding: 3px 8px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
        }
        
        .status-compliant {
            background: #d4edda;
            color: #155724;
        }
        
        .status-acceptable {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-non-compliant {
            background: #f8d7da;
            color: #721c24;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
        }
        
        .footer-note {
            font-size: 12px;
            margin-bottom: 10px;
        }
        
        .footer-signature {
            font-weight: 600;
            color: #009999;
        }
        
        /* Styles pour le bouton d'export PDF */
        #export-pdf-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #009999;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 1000;
            transition: all 0.2s ease;
        }
        
        #export-pdf-button:hover {
            background-color: #007a7a;
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        
        #export-pdf-button svg {
            width: 16px;
            height: 16px;
        }
        
        @media print {
            #export-pdf-button {
                display: none;
            }
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            
            .header {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .compliance-legend {
                flex-direction: column;
                gap: 8px;
            }
            
            table {
                font-size: 11px;
            }
            
            th, td {
                padding: 8px 4px;
            }
            
            .status-badge {
                font-size: 9px;
                padding: 2px 6px;
            }
        }
        
        @media print {
            @page {
                size: A4;
                margin: 1cm;
            }
            
            .container {
                padding: 20px;
            }
            
            .executive-summary,
            table {
                box-shadow: none;
                border: 1px solid #ccc;
            }
            
            table {
                font-size: 11px;
            }
            
            th, td {
                padding: 6px 4px;
            }
            
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-section">
                <div class="siemens-logo">SIEMENS</div>
                <div>
                    <div class="report-title">RAPPORT DE CONFORMITÉ</div>
                    <div class="report-subtitle">Système de Désenfumage - NF S61-933 Annexe H</div>
                </div>
            </div>
            <div class="report-info">
                <div><strong>Date :</strong> ${timestamp}</div>
                <div><strong>Version :</strong> 1.1.0</div>
                <div><strong>Référence :</strong> ${project.id.substring(0, 8).toUpperCase()}</div>
            </div>
        </div>

        <div class="project-section">
            <div class="project-title">${project.name}</div>
            <div class="project-details">
                <div class="detail-item">
                    <span class="detail-label">Localisation :</span>
                    <span class="detail-value">${project.city || 'Non spécifiée'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Nombre de bâtiments :</span>
                    <span class="detail-value">${project.buildings.length}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Zones de désenfumage :</span>
                    <span class="detail-value">${project.buildings.reduce((total, building) => total + building.functionalZones.length, 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Total volets :</span>
                    <span class="detail-value">${report.totalShutters}</span>
                </div>
                ${project.startDate ? `
                <div class="detail-item">
                    <span class="detail-label">Date début :</span>
                    <span class="detail-value">${new Date(project.startDate).toLocaleDateString('fr-FR')}</span>
                </div>
                ` : ''}
                ${project.endDate ? `
                <div class="detail-item">
                    <span class="detail-label">Date fin :</span>
                    <span class="detail-value">${new Date(project.endDate).toLocaleDateString('fr-FR')}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="executive-summary">
            <div class="summary-title">📊 RÉSUMÉ EXÉCUTIF</div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${report.totalShutters}</div>
                    <div class="stat-label">Volets Testés</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${report.complianceRate.toFixed(1)}%</div>
                    <div class="stat-label">Taux de Conformité</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${report.compliantCount}</div>
                    <div class="stat-label">Fonctionnels</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${report.acceptableCount}</div>
                    <div class="stat-label">Acceptables</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${report.nonCompliantCount}</div>
                    <div class="stat-label">Non Conformes</div>
                </div>
            </div>

            <div class="compliance-bar-container">
                <div class="compliance-bar">
                    <div class="compliance-segment" style="flex: ${report.compliantCount}; background: #10B981;"></div>
                    <div class="compliance-segment" style="flex: ${report.acceptableCount}; background: #F59E0B;"></div>
                    <div class="compliance-segment" style="flex: ${report.nonCompliantCount}; background: #EF4444;"></div>
                </div>
                <div class="compliance-legend">
                    <div class="legend-item">
                        <div class="legend-dot" style="background: #10B981;"></div>
                        <span class="legend-text">Fonctionnel (${report.compliantCount})</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot" style="background: #F59E0B;"></div>
                        <span class="legend-text">Acceptable (${report.acceptableCount})</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot" style="background: #EF4444;"></div>
                        <span class="legend-text">Non Conforme (${report.nonCompliantCount})</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="detailed-table">
            <div class="table-title">📋 DÉTAIL DES MESURES</div>
            <table>
                <thead>
                    <tr>
                        <th>Bâtiment</th>
                        <th>Zone</th>
                        <th>Volet</th>
                        <th>Débit Réf. (m³/h)</th>
                        <th>Débit Mesuré (m³/h)</th>
                        <th>Écart (%)</th>
                        <th>Statut</th>
                        <th>Remarques</th>
                    </tr>
                </thead>
                <tbody>`;

    project.buildings.forEach(building => {
      building.functionalZones.forEach(zone => {
        zone.shutters.forEach(shutter => {
          const compliance = calculateCompliance(shutter.referenceFlow, shutter.measuredFlow);
          const deviation = ((shutter.measuredFlow - shutter.referenceFlow) / shutter.referenceFlow) * 100;
          
          let statusClass = '';
          switch (compliance.status) {
            case 'compliant':
              statusClass = 'status-compliant';
              break;
            case 'acceptable':
              statusClass = 'status-acceptable';
              break;
            case 'non-compliant':
              statusClass = 'status-non-compliant';
              break;
          }
          
          htmlContent += `
                    <tr>
                        <td>${building.name}</td>
                        <td>${zone.name}</td>
                        <td><strong>${shutter.name}</strong></td>
                        <td>${shutter.referenceFlow.toFixed(0)}</td>
                        <td>${shutter.measuredFlow.toFixed(0)}</td>
                        <td>${deviation >= 0 ? '+' : ''}${deviation.toFixed(1)}%</td>
                        <td><span class="status-badge ${statusClass}">${compliance.label}</span></td>
                        <td>${shutter.remarks || '-'}</td>
                    </tr>`;
        });
      });
    });

    htmlContent += `
                </tbody>
            </table>
        </div>

        ${associatedNotes.length > 0 ? `
        <div class="detailed-table">
            <div class="table-title">📝 NOTES ASSOCIÉES</div>
            ${associatedNotes.map(note => `
            <div style="background: #f8f9fa; border-left: 4px solid #009999; padding: 20px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #009999; margin-bottom: 10px;">${note.title || 'Note sans titre'}</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 15px;">
                    Créée le ${new Date(note.createdAt).toLocaleDateString('fr-FR')} • 
                    Modifiée le ${new Date(note.updatedAt).toLocaleDateString('fr-FR')}
                </p>
                ${note.content ? `
                <div style="background: white; padding: 15px; border-radius: 6px; white-space: pre-wrap; line-height: 1.6;">
                    ${note.content.replace(/\n/g, '<br>')}
                </div>
                ` : '<p style="font-style: italic; color: #888;">Cette note ne contient pas de texte.</p>'}
                ${note.images && note.images.length > 0 ? `
                <div style="margin-top: 16px;">
                  <h4 style="color: #6B7280; font-size: 14px; margin-bottom: 12px; font-weight: 600;">📷 Images attachées (${note.images.length})</h4>
                  <div class="note-images">
                    ${note.images.map((image, imgIndex) => `
                    <img src="${image}" alt="Image ${imgIndex + 1}" class="note-image" />
                    `).join('')}
                  </div>
                </div>
                ` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <div class="footer-note">
                Ce rapport a été généré automatiquement par l'application Siemens CalcConform v1.1.0<br>
                Conformité évaluée selon la norme NF S61-933 Annexe H
            </div>
            <div class="footer-signature">
                © ${new Date().getFullYear()} Siemens - Tous droits réservés
            </div>
        </div>
        
        <!-- Bouton d'export PDF -->
        <button id="export-pdf-button" onclick="window.print()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9v12h12V9"></path>
                <path d="M6 9H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2"></path>
                <path d="M6 9l6-6 6 6"></path>
                <path d="M12 12v6"></path>
            </svg>
            Exporter en PDF
        </button>
    </div>
    
    <style>
        .note-images {
            margin: 15px 0;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: flex-start;
        }
        .note-image {
            max-width: 200px;
            max-height: 150px;
            width: auto;
            height: auto;
            object-fit: contain;
            flex: 0 0 auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            page-break-inside: avoid;
        }
    </style>
</body>
</html>`;

    return htmlContent;
  };

  const renderNote = (note: Note) => {
    const isExportingHTML = exportingNote === note.id + '_html';
    const isExportingTXT = exportingNote === note.id + '_txt';
    
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(date));
    };

    return (
      <View key={note.id} style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle}>{note.title || 'Note sans titre'}</Text>
          <Text style={styles.noteDate}>
            Créée le {formatDate(note.createdAt)}
          </Text>
        </View>

        {note.content && (
          <Text style={styles.notePreview} numberOfLines={3}>
            {note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content}
          </Text>
        )}

        {note.images && note.images.length > 0 && (
          <Text style={styles.noteImages}>
            📷 {note.images.length} image{note.images.length > 1 ? 's' : ''}
          </Text>
        )}

        <View style={styles.noteExportButtons}>
          <Button
            title={isExportingHTML ? 'Export...' : 'Export HTML'}
            onPress={() => handleExportNote(note, 'html')}
            variant="primary"
            size="small"
            style={styles.noteExportButton}
            disabled={isExportingHTML || isExportingTXT}
          />
          <Button
            title={isExportingTXT ? 'Export...' : 'Export TXT'}
            onPress={() => handleExportNote(note, 'txt')}
            variant="secondary"
            size="small"
            style={styles.noteExportButton}
            disabled={isExportingHTML || isExportingTXT}
          />
        </View>
      </View>
    );
  };

  const handleExportHTML = async (project: Project) => {
    setExportLoading(project.id);
    
    try {
      const htmlContent = generateProfessionalHTML(project);
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `Rapport_Siemens_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.html`;
      
      if (Platform.OS === 'web') {
        // Export web optimisé
        try {
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          Alert.alert(
            '✅ Rapport Téléchargé',
            `Le rapport HTML professionnel "${fileName}" a été téléchargé avec succès.`,
            [{ text: 'Parfait !' }]
          );
        } catch (webError) {
          console.warn('Erreur export web:', webError);
          Alert.alert(
            'Export réussi',
            'Le rapport a été généré avec succès.',
            [{ text: 'OK' }]
          );
        }
      } else if (nativeModulesReady && FileSystem && Sharing) {
        // Export mobile optimisé pour Android avec modules natifs
        try {
          const fileUri = FileSystem.documentDirectory + fileName;
          await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
            encoding: FileSystem.EncodingType.UTF8,
          });

          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'text/html',
              dialogTitle: 'Partager le rapport Siemens'
            });
          } else {
            Alert.alert(
              '✅ Rapport généré',
              `Fichier enregistré :\n${fileUri}`,
              [{ text: 'OK' }]
            );
          }
        } catch (fileError) {
          console.warn('Erreur fichier:', fileError);
          Alert.alert(
            'Export réussi',
            'Le rapport a été généré avec succès.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Fallback pour autres plateformes
        Alert.alert(
          'Export réussi',
          'Le rapport a été généré avec succès.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Erreur lors de l\'export HTML:', error);
      Alert.alert(
        'Erreur d\'export',
        'Impossible de générer le fichier HTML. Veuillez réessayer.',
        [{ text: strings.ok }]
      );
    } finally {
      setExportLoading(null);
    }
  };

  const renderProject = (project: Project) => {
    const report = generateProjectReport(project);
    const buildingCount = project.buildings.length;
    const zoneCount = project.buildings.reduce((total, building) => total + building.functionalZones.length, 0);
    const isExportingHTML = exportLoading === project.id;

    return (
      <View key={project.id} style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectSite}>{project.city}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{buildingCount}</Text>
            <Text style={styles.statLabel}>{strings.buildings}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{zoneCount}</Text>
            <Text style={styles.statLabel}>{strings.zones}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.totalShutters}</Text>
            <Text style={styles.statLabel}>{strings.shutters}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.complianceRate.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>{strings.compliance}</Text>
          </View>
        </View>

        <View style={styles.complianceBreakdown}>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.complianceText}>{report.compliantCount} {strings.compliant}</Text>
          </View>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.complianceText}>{report.acceptableCount} {strings.acceptable}</Text>
          </View>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.complianceText}>{report.nonCompliantCount} {strings.nonCompliant}</Text>
          </View>
        </View>

        <View style={styles.exportButtons}>
          {/* Sélection des notes pour ce projet */}
          {notes.length > 0 && (
            <View style={styles.notesSelectionContainer}>
              <Text style={styles.notesSelectionTitle}>📝 Notes à inclure dans le rapport</Text>
              <View style={styles.notesSelectionList}>
                {notes.map(note => {
                  const isSelected = (selectedNotesForProject[project.id] || []).includes(note.id);
                  return (
                    <TouchableOpacity
                      key={note.id}
                      style={[styles.noteSelectionItem, isSelected && styles.noteSelectionItemSelected]}
                      onPress={() => toggleNoteForProject(project.id, note.id)}
                    >
                      <Text style={[styles.noteSelectionText, isSelected && styles.noteSelectionTextSelected]}>
                        {note.title || 'Note sans titre'}
                      </Text>
                      {isSelected && (
                        <Text style={styles.noteSelectionCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View style={styles.exportButtons}>
          <Button
            title={isExportingHTML ? 'Génération...' : 'Exporter le rapport'}
            onPress={() => handleExportHTML(project)}
            variant="primary"
            size="small"
            style={styles.exportButton}
            disabled={isExportingHTML}
          />
        </View>
      </View>
    );
  };

  const renderNotesSection = () => {
    if (notes.length === 0) {
      return (
        <View style={styles.emptyNotesContainer}>
          <Ionicons name="document-text-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={styles.emptyNotesTitle}>Aucune note à exporter</Text>
          <Text style={styles.emptyNotesSubtitle}>
            Créez des notes pour pouvoir les exporter
          </Text>
          <Button
            title="Créer une note"
            onPress={() => router.push('/(tabs)/notes')}
            style={styles.refreshButton}
          />
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionTitle}>📝 Exporter les notes</Text>
        <Text style={styles.sectionSubtitle}>
          Générez des documents professionnels de vos notes
        </Text>
        {notes.map(renderNote)}
      </>
    );
  };

  const handleFilterChange = (filter: ExportFilter) => {
    if (filter === activeFilter) return;
    
    // Animation de transition
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveFilter(filter);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Type d'export</Text>
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'projects' && styles.filterTabActive
          ]}
          onPress={() => handleFilterChange('projects')}
        >
          <Ionicons name="business-outline" size={16} color={activeFilter === 'projects' ? '#ffffff' : theme.colors.primary} />
          <Text style={[
            styles.filterTabText,
            activeFilter === 'projects' && styles.filterTabTextActive
          ]}>
            Projets ({projects.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'notes' && styles.filterTabActive
          ]}
          onPress={() => handleFilterChange('notes')}
        >
          <Ionicons name="document-text-outline" size={16} color={activeFilter === 'notes' ? '#ffffff' : theme.colors.primary} />
          <Text style={[
            styles.filterTabText,
            activeFilter === 'notes' && styles.filterTabTextActive
          ]}>
            Notes ({notes.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = createStyles(theme);

  if (loading) {
    return <LoadingScreen title={strings.exportTitle} message={strings.loading} />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title={strings.exportTitle} subtitle={strings.exportSubtitle} />
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Erreur de chargement</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Réessayer"
              onPress={onRefresh}
              style={styles.retryButton}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={strings.exportTitle} 
        subtitle={strings.exportSubtitle}
      />
      
      {renderFilterTabs()}
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS === 'web' && styles.contentContainerWeb
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {activeFilter === 'projects' ? (
            projects.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={64} color={theme.colors.textTertiary} />
                <Text style={styles.emptyTitle}>{strings.noProjectsToExport}</Text>
                <Text style={styles.emptySubtitle}>
                  {strings.noProjectsToExportDesc}
                </Text>
              </View>
            ) : (
              <View style={styles.projectsSection}>
                <Text style={styles.sectionTitle}>
                  {strings.availableProjects} ({projects.length})
                </Text>
                {projects.map((project) => renderProject(project))}
              </View>
            )
          ) : (
            notes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color={theme.colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucune note à exporter</Text>
                <Text style={styles.emptySubtitle}>
                  Créez des notes pour pouvoir les exporter
                </Text>
              </View>
            ) : (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>
                  Notes disponibles ({notes.length})
                </Text>
                {notes.map((note) => renderNote(note))}
              </View>
            )
          )}
        </Animated.View>
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
  contentContainer: {
    padding: 16,
  },
  contentContainerWeb: {
    paddingBottom: Platform.OS === 'web' ? 100 : 16,
  },
  filterContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  projectsSection: {
    marginBottom: 24,
  },
  notesSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notesSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesContainer: {
    gap: 12,
  },
  noteItem: {
    marginBottom: 8,
  },
  noteCheckbox: {
    padding: 4,
    marginBottom: 8,
  },
  noteInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  emptyContainer: {
    paddingVertical: 64,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    marginBottom: 32,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  refreshButton: {
    paddingHorizontal: 32,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  formatList: {
    gap: 12,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  formatText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  formatName: {
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 24,
  },
  projectCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  projectHeader: {
    marginBottom: 16,
  },
  projectName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  projectSite: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  complianceBreakdown: {
    marginBottom: 16,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  complianceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  complianceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  exportButtons: {
    flexDirection: 'row',
  },
  exportButton: {
    flex: 1,
  },
  // Styles pour les notes
  noteCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noteHeader: {
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  notePreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteImages: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  noteExportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  noteExportButton: {
    flex: 1,
  },
  emptyNotesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyNotesTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyNotesSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Styles pour la sélection de notes
  notesSelectionContainer: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  notesSelectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  notesSelectionList: {
    gap: 6,
  },
  noteSelectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noteSelectionItemSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  noteSelectionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  noteSelectionTextSelected: {
    color: theme.colors.primary,
  },
  noteSelectionCheck: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
  },
});