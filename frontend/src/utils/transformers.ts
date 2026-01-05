import type { ReferralCode, DashboardStats, TimeSeriesData } from '../types';
import type { BackendReferral } from '../types/backend';

/**
 * Transform backend referral data to frontend format
 */
export function transformReferralCode(backendRef: BackendReferral): ReferralCode {
  const now = new Date();
  const endDate = backendRef.endDate ? new Date(backendRef.endDate) : null;
  const startDate = backendRef.startDate ? new Date(backendRef.startDate) : null;
  
  // Determine status based on dates
  let status: 'active' | 'inactive' = 'active';
  if (endDate && endDate < now) {
    status = 'inactive';
  } else if (startDate && startDate > now) {
    status = 'inactive';
  }

  // Get conversions from purchase numbers (trial + paid)
  const trialConversions = backendRef.purchaseNumbers?.trial || 0;
  const paidConversions = backendRef.purchaseNumbers?.paid || 0;
  const conversions = trialConversions + paidConversions;

  return {
    id: backendRef._id,
    code: backendRef.referralCode,
    createdAt: backendRef.createdAt || new Date().toISOString(),
    conversions,
    status,
    trialConversions,
    paidConversions,
  };
}

/**
 * Transform array of backend referrals to frontend format
 */
export function transformReferralCodes(
  backendRefs: BackendReferral[]
): ReferralCode[] {
  return backendRefs.map(transformReferralCode);
}

/**
 * Calculate dashboard stats from referral codes
 */
export function calculateDashboardStats(
  referralCodes: ReferralCode[]
): DashboardStats {
  const totalConversions = referralCodes.reduce(
    (sum, code) => sum + code.conversions,
    0
  );
  const trialConversions = referralCodes.reduce(
    (sum, code) => sum + (code.trialConversions || 0),
    0
  );
  const paidConversions = referralCodes.reduce(
    (sum, code) => sum + (code.paidConversions || 0),
    0
  );

  return {
    totalReferralCodes: referralCodes.length,
    totalConversions,
    trialConversions,
    paidConversions,
  };
}

/**
 * Generate time series data from referral codes
 * This function is deprecated - use generateTimeSeriesFromEvents instead
 */
export function generateTimeSeriesData(
  _referralCodes: ReferralCode[]
): TimeSeriesData[] {
  // This is a placeholder - actual time series should come from purchase history events
  const data: TimeSeriesData[] = [];
  const today = new Date();

  // Generate last 30 days with zero data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    data.push({
      date: dateKey,
      conversions: 0,
      trialConversions: 0,
      paidConversions: 0,
    });
  }

  return data;
}

