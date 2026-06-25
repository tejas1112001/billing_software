import type { OperatorType } from '@/types';

/**
 * Maps internal operator type values to user-facing display names
 */
export function getOperatorTypeDisplay(operatorType: OperatorType | null | undefined): string {
  if (!operatorType) return '';
  return operatorType === 'CASH' ? 'Gold' : 'Platinum';
}
