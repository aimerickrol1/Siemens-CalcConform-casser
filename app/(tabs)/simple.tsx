import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Clock, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { ComplianceIndicator } from '@/components/ComplianceIndicator';
import { Button } from '@/components/Button';
import { calculateCompliance, formatDeviation } from '@/utils/compliance';
import { useStorage, QuickCalcHistoryItem } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function SimpleCalculatorScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { quickCalcHistory, addQuickCalcHistory, clearQuickCalcHistory, removeQuickCalcHistoryItem } = useStorage();
  const [referenceFlow, setReferenceFlow] = useState('');
  const [measuredFlow, setMeasuredFlow] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef<ScrollView>(null);

  // Animation de fondu à l'entrée de la page
  useFocusEffect(
    useCallback(() => {
      console.log('Simple calc screen focused, animating...');
      
      // Animation de fondu à l'entrée
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const getCompliance = () => {
    const ref = parseFloat(referenceFlow);
    const measured = parseFloat(measuredFlow);
    
    if (isNaN(ref) || isNaN(measured) || ref <= 0) {
      return null;
    }
    
    return calculateCompliance(ref, measured);
  };

  const compliance = getCompliance();

  const saveToHistory = async () => {
    if (!compliance) return;

    const ref = parseFloat(referenceFlow);
    const measured = parseFloat(measuredFlow);

    try {
      await addQuickCalcHistory({
        referenceFlow: ref,
        measuredFlow: measured,
        deviation: compliance.deviation,
        status: compliance.status,
        color: compliance.color
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans l\'historique:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await clearQuickCalcHistory();
    } catch (error) {
      console.error('Erreur lors de l\'effacement de l\'historique:', error);
    }
  };

  const removeHistoryItem = async (itemId: string) => {
    try {
      await removeQuickCalcHistoryItem(itemId);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'élément:', error);
    }
  };

  const clearInputs = () => {
    setReferenceFlow('');
    setMeasuredFlow('');
  };

  const getDeviationIcon = () => {
    if (!compliance) return null;
    
    const iconSize = 24;
    const iconColor = compliance.color;
    
    if (compliance.deviation > 0) {
      return <Ionicons name="trending-up" size={iconSize} color={iconColor} />;
    } else if (compliance.deviation < 0) {
      return <Ionicons name="trending-down" size={iconSize} color={iconColor} />;
    } else {
      return <Ionicons name="remove" size={iconSize} color={iconColor} />;
    }
  };

  const formatHistoryDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  const useHistoryItem = (item: QuickCalcHistoryItem) => {
    setReferenceFlow(item.referenceFlow.toString());
    setMeasuredFlow(item.measuredFlow.toString());
    
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ 
          y: 300,
          animated: true 
        });
      }
    }, 200);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Fonctionnel';
      case 'acceptable':
        return 'Acceptable';
      case 'non-compliant':
        return 'Non conforme';
      default:
        return '';
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.select({
        ios: 'padding',
        web: 'height',
        default: 'height'
      })}
      keyboardVerticalOffset={Platform.select({
        ios: 0,
        web: 0,
        default: 20
      })}
    >
      <Header 
        title={strings.quickCalc} 
        subtitle={strings.quickCalcSubtitle}
      />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS === 'web' && styles.contentContainerWeb
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.calculatorCard, { opacity: fadeAnim }]}>
          <View style={styles.calculatorHeader}>
            <Ionicons name="calculator-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>{strings.complianceCalculator}</Text>
          </View>

          <Input
            label={strings.referenceFlow + " (m³/h) *"}
            value={referenceFlow}
            onChangeText={setReferenceFlow}
            placeholder="Ex: 5000"
            keyboardType="numeric"
          />

          <Input
            label={strings.measuredFlow + " (m³/h) *"}
            value={measuredFlow}
            onChangeText={setMeasuredFlow}
            placeholder="Ex: 4800"
            keyboardType="numeric"
          />

          {(referenceFlow || measuredFlow) && (
            <View style={styles.clearButton}>
              <Text 
                style={styles.clearButtonText}
                onPress={clearInputs}
              >
                {strings.clearValues}
              </Text>
            </View>
          )}
        </Animated.View>

        {compliance ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={[styles.resultCard, { borderColor: compliance.color }]}>
              <Text style={styles.resultTitle}>{strings.complianceResult}</Text>
              
              <View style={styles.deviationContainer}>
                <Text style={styles.deviationLabel}>{strings.calculatedDeviation}</Text>
                <View style={styles.deviationIcon}>
                  {getDeviationIcon()}
                </View>
                <Text style={[styles.deviationValue, { color: compliance.color }]}>
                  {formatDeviation(compliance.deviation)}
                </Text>
              </View>

              <View style={styles.complianceContainer}>
                <ComplianceIndicator compliance={compliance} size="large" />
              </View>

              <Text style={styles.complianceDescription}>
                {compliance.status === 'compliant' && "Un écart inférieur à 10% entre les valeurs retenues lors de cet essai fonctionnel et les valeurs de référence conduit au constat du fonctionnement attendu du système de désenfumage mécanique."}
                {compliance.status === 'acceptable' && "Un écart compris entre 10% et 20% entre les valeurs retenues lors de cet essai fonctionnel et les valeurs de référence conduit à signaler cette dérive, par une proposition d'action corrective à l'exploitant ou au chef d'établissement."}
                {compliance.status === 'non-compliant' && "Un écart supérieur à 20% entre les valeurs retenues lors de cet essai fonctionnel et les valeurs de référence retenues à la mise en service, doit conduire à une action corrective."}
              </Text>

              <View style={styles.saveToHistoryContainer}>
                <Button
                  title="Sauvegarder dans l'historique"
                  onPress={saveToHistory}
                  variant="secondary"
                  size="small"
                />
              </View>
            </View>
          </Animated.View>
        ) : (
          null
        )}

        <Animated.View style={[styles.historyCard, { opacity: fadeAnim }]}>
          <View style={styles.historyHeader}>
            <TouchableOpacity 
              style={styles.historyHeaderButton}
              onPress={() => setHistoryExpanded(!historyExpanded)}
            >
              <View style={styles.historyHeaderContent}>
                <Clock size={18} color={theme.colors.primary} />
                <Text style={styles.historyTitle}>
                  {quickCalcHistory.length > 0 
                    ? `Historique des calculs (${quickCalcHistory.length})`
                    : 'Historique des calculs'
                  }
                </Text>
              </View>
              <View style={styles.historyChevron}>
                {historyExpanded ? (
                  <ChevronDown size={16} color={theme.colors.primary} />
                ) : (
                  <ChevronRight size={16} color={theme.colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {historyExpanded && quickCalcHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Text style={styles.emptyHistoryText}>
                Aucun calcul effectué récemment
              </Text>
              <Text style={styles.emptyHistorySubtext}>
                Vos calculs sauvegardés apparaîtront ici
              </Text>
            </View>
          ) : historyExpanded && (
            <>
              {quickCalcHistory.length > 0 && (
                <View style={styles.historyActions}>
                  <TouchableOpacity 
                    style={styles.clearHistoryButton}
                    onPress={clearHistory}
                  >
                    <Trash2 size={14} color={theme.colors.error} />
                    <Text style={styles.clearHistoryText}>Tout effacer</Text>
                  </TouchableOpacity>
                </View>
              )}
            <View style={styles.historyList}>
              {quickCalcHistory.map((item, index) => (
                <View
                  key={item.id}
                  style={styles.historyItem}
                >
                  <TouchableOpacity
                    style={styles.historyItemContent}
                    onPress={() => useHistoryItem(item)}
                  >
                    <View style={styles.historyItemHeader}>
                      <Text style={[styles.historyStatusText, { color: item.color }]}>
                        {getStatusText(item.status)}
                      </Text>
                      <Text style={styles.historyItemTime}>
                        {formatHistoryDate(item.timestamp)}
                      </Text>
                    </View>
                    
                    <View style={styles.historyItemData}>
                      <View style={styles.historyDataColumn}>
                        <Text style={styles.historyDataLabel}>Référence</Text>
                        <Text style={styles.historyDataValue}>
                          {item.referenceFlow.toFixed(0)} m³/h
                        </Text>
                      </View>
                      
                      <View style={styles.historyDataColumn}>
                        <Text style={styles.historyDataLabel}>Mesuré</Text>
                        <Text style={styles.historyDataValue}>
                          {item.measuredFlow.toFixed(0)} m³/h
                        </Text>
                      </View>
                      
                      <View style={styles.historyDataColumn}>
                        <Text style={styles.historyDataLabel}>Écart</Text>
                        <Text style={[styles.historyDataValue, { color: item.color }]}>
                          {formatDeviation(item.deviation)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyItemFooter}>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteHistoryItemButton}
                    onPress={() => removeHistoryItem(item.id)}
                  >
                    <X size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            </>
          )}
        </Animated.View>

        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <Text style={styles.infoTitle}>NF S61-933 Annexe H</Text>
          <Text style={styles.infoText}>
            {strings.nfStandardDesc}{'\n\n'}<Text>• </Text><Text style={{ color: '#10B981', fontFamily: 'Inter-SemiBold' }}>{strings.compliant}</Text><Text> : </Text>{strings.deviation} ≤ ±10%{'\n'}<Text>• </Text><Text style={{ color: '#F59E0B', fontFamily: 'Inter-SemiBold' }}>{strings.acceptable}</Text><Text> : </Text>{strings.deviation} ±10% - ±20%{'\n'}<Text>• </Text><Text style={{ color: '#EF4444', fontFamily: 'Inter-SemiBold' }}>{strings.nonCompliant}</Text><Text> : </Text>{strings.deviation} > ±20%
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 100,
  },
  contentContainerWeb: {
    paddingBottom: Platform.OS === 'web' ? 120 : 100,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  calculatorCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  deviationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deviationLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  deviationValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  deviationIcon: {
    marginBottom: 12,
  },
  complianceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  complianceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  saveToHistoryContainer: {
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  clearButton: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  historyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyChevron: {
    marginLeft: 8,
  },
  historyTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  historyActions: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.error + '20',
    borderWidth: 1,
    borderColor: theme.colors.error + '40',
    alignSelf: 'flex-start',
  },
  clearHistoryText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: theme.colors.error,
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyHistoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  emptyHistorySubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textTertiary,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  historyItemContent: {
    flex: 1,
    padding: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textTertiary,
  },
  historyItemData: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  historyDataColumn: {
    flex: 1,
    alignItems: 'center',
  },
  historyDataLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyDataValue: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  historyItemFooter: {
    alignItems: 'center',
  },
  historyStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteHistoryItemButton: {
    width: 44,
    height: '100%',
    backgroundColor: theme.colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.error + '40',
  },
});