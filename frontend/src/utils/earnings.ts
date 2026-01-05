import type { CommissionRate, EarningsBreakdown } from '../types/commission';

/**
 * Calculate earnings for a referral code
 */
export function calculateEarnings(
  trialConversions: number,
  paidConversions: number,
  rates: CommissionRate
): EarningsBreakdown {
  const fromTrials = trialConversions * rates.perTrialConversion;
  const fromPaid = paidConversions * rates.perPaidConversion;
  const total = fromTrials + fromPaid;

  return {
    fromTrials: Number(fromTrials.toFixed(2)),
    fromPaid: Number(fromPaid.toFixed(2)),
    total: Number(total.toFixed(2)),
    currency: rates.currency,
  };
}

/**
 * Calculate total earnings from multiple referral codes
 */
export function calculateTotalEarnings(
  codes: Array<{
    trialConversions: number;
    paidConversions: number;
  }>,
  rates: CommissionRate
): EarningsBreakdown {
  const totals = codes.reduce(
    (acc, code) => {
      acc.trial += code.trialConversions || 0;
      acc.paid += code.paidConversions || 0;
      return acc;
    },
    { trial: 0, paid: 0 }
  );

  return calculateEarnings(totals.trial, totals.paid, rates);
}

/**
 * Calculate average earnings per conversion
 */
export function calculateAverageEarningsPerConversion(
  totalEarnings: number,
  totalConversions: number
): number {
  if (totalConversions === 0) return 0;
  return Number((totalEarnings / totalConversions).toFixed(2));
}

