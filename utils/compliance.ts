import { ComplianceResult } from '@/types';
import { getStrings } from '@/utils/i18n';

/**
 * Calcule la conformité selon la norme NFS 61-933/A3 (2025)
 */
export function calculateCompliance(referenceFlow: number, measuredFlow: number): ComplianceResult {
  const strings = getStrings(); // NOUVEAU : Obtenir les traductions actuelles

  if (referenceFlow === 0) {
    return {
      deviation: 0,
      status: 'non-compliant',
      color: '#EF4444',
      label: strings.invalidReference // CORRIGÉ : Utiliser la traduction
    };
  }

  const deviation = ((measuredFlow - referenceFlow) / referenceFlow) * 100;
  const absoluteDeviation = Math.abs(deviation);

  if (absoluteDeviation < 10) {
    return {
      deviation,
      status: 'compliant',
      color: '#10B981',
      label: strings.compliant // CORRIGÉ : Utiliser la traduction
    };
  } else if (absoluteDeviation <= 20) {
    return {
      deviation,
      status: 'acceptable',
      color: '#F59E0B',
      label: strings.acceptable // CORRIGÉ : Utiliser la traduction
    };
  } else {
    return {
      deviation,
      status: 'non-compliant',
      color: '#EF4444',
      label: strings.nonCompliant // CORRIGÉ : Utiliser la traduction
    };
  }
}

export function formatDeviation(deviation: number): string {
  const sign = deviation >= 0 ? '+' : '';
  return `${sign}${deviation.toFixed(1)}%`;
}