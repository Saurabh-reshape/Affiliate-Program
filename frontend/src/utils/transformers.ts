import type {
  ReferralCode,
  DashboardStats,
  TimeSeriesData,
  ReferralStatus,
} from "../types";
import type { AffiliateReferralCode } from "../types/commission";
import { calculateEarnings } from "./earnings";

/**
 * Provide a shared zeroed-out dashboard stats structure
 */
export function createEmptyDashboardStats(
  currency: string = "USD"
): DashboardStats {
  return {
    totalReferralCodes: 0,
    activeReferralCodes: 0,
    inactiveReferralCodes: 0,
    exhaustedReferralCodes: 0,
    totalConversions: 0,
    totalReferrals: 0,
    signupConversions: 0,
    trialConversions: 0,
    paidConversions: 0,
    totalEarnings: {
      breakdown: {},
      total: 0,
      currency,
    },
  };
}

/**
 * Transform backend referral data to frontend format
 */
export function transformReferralCode(
  backendRef: AffiliateReferralCode
): ReferralCode {
  const now = new Date();
  const endDate = backendRef.endDate ? new Date(backendRef.endDate) : null;
  const startDate = backendRef.startDate
    ? new Date(backendRef.startDate)
    : null;
  const quota = typeof backendRef.quota === "number" ? backendRef.quota : null;

  // Use stats from backend
  const referralsCount = backendRef.stats?.totalReferrals ?? 0;
  const signupConversions = referralsCount; // signups = referrals count
  const trialConversions = backendRef.stats?.free_trial ?? 0;
  const paidConversions = backendRef.stats?.purchase ?? 0;
  // Total conversions = signup + free_trial + paid
  const conversions = signupConversions + trialConversions + paidConversions;
  const usageCount = Math.max(conversions, referralsCount);

  // Determine status based on dates
  let status: ReferralStatus = "active";
  const inactiveBySchedule = Boolean(
    (endDate && endDate < now) || (startDate && startDate > now)
  );

  if (inactiveBySchedule) {
    status = "inactive";
  } else if (quota !== null && usageCount >= quota) {
    status = "exhausted";
  }

  // Calculate earnings using dynamic rules from the code itself
  // Map our stats keys to the event names expected in rules
  const earningsStats = {
    // Signup earnings are derived from total referrals (each referral implies a signup)
    signup: referralsCount,
    free_trial: trialConversions,
    purchase: paidConversions,
  };

  const earnings = calculateEarnings(
    earningsStats,
    backendRef.commissionConfig || []
  );

  return {
    id: backendRef.id,
    code: backendRef.code,
    createdAt:
      backendRef.createdAt || backendRef.startDate || new Date().toISOString(),
    conversions,
    status,
    commissionConfig: backendRef.commissionConfig || [],
    quota,
    referralsCount,
    signupConversions,
    startDate: backendRef.startDate || null,
    endDate: backendRef.endDate || null,
    durationDays: backendRef.noOfDays,
    trialConversions,
    paidConversions,
    earnings,
  };
}

/**
 * Transform array of backend referrals to frontend format
 */
export function transformReferralCodes(
  backendRefs: AffiliateReferralCode[]
): ReferralCode[] {
  return backendRefs.map((ref) => transformReferralCode(ref));
}

/**
 * Calculate dashboard stats from referral codes
 */
export function calculateDashboardStats(
  referralCodes: ReferralCode[]
): DashboardStats {
  const defaultCurrency =
    referralCodes.find((code) => code.earnings)?.earnings?.currency || "USD";

  const emptyStats = createEmptyDashboardStats(defaultCurrency);

  const totals = referralCodes.reduce((acc, code) => {
    acc.totalConversions += code.conversions || 0;
    acc.signupConversions += code.signupConversions || 0;
    acc.trialConversions += code.trialConversions || 0;
    acc.paidConversions += code.paidConversions || 0;
    acc.totalReferrals += code.referralsCount || 0;

    if (code.status === "active") {
      acc.activeReferralCodes += 1;
    } else if (code.status === "inactive") {
      acc.inactiveReferralCodes += 1;
    } else if (code.status === "exhausted") {
      acc.exhaustedReferralCodes += 1;
    }

    if (code.earnings) {
      acc.totalEarnings.total += code.earnings.total;
      acc.totalEarnings.currency = code.earnings.currency;

      // Aggregate breakdown
      for (const [event, amount] of Object.entries(code.earnings.breakdown)) {
        acc.totalEarnings.breakdown[event] =
          (acc.totalEarnings.breakdown[event] || 0) + amount;
      }
    }

    return acc;
  }, emptyStats);

  return {
    totalReferralCodes: referralCodes.length,
    activeReferralCodes: totals.activeReferralCodes,
    inactiveReferralCodes: totals.inactiveReferralCodes,
    exhaustedReferralCodes: totals.exhaustedReferralCodes,
    totalConversions: totals.totalConversions,
    totalReferrals: totals.totalReferrals,
    signupConversions: totals.signupConversions,
    trialConversions: totals.trialConversions,
    paidConversions: totals.paidConversions,
    totalEarnings: {
      breakdown: totals.totalEarnings.breakdown,
      total: Number(totals.totalEarnings.total.toFixed(2)),
      currency: totals.totalEarnings.currency,
    },
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
    const dateKey = date.toISOString().split("T")[0];

    data.push({
      date: dateKey,
      signupConversions: 0,
      trialConversions: 0,
      paidConversions: 0,
    });
  }

  return data;
}

/**
 * Find the earliest meaningful start date across referral codes.
 * Prefers explicit startDate, falls back to createdAt.
 */
export function getEarliestStartDate(
  referralCodes: ReferralCode[]
): string | null {
  if (!referralCodes.length) return null;

  const timestamps: number[] = [];

  referralCodes.forEach((code) => {
    const candidate =
      code.startDate ||
      (code.createdAt ? code.createdAt.split("T")[0] : undefined);
    if (candidate) {
      const ts = new Date(candidate).getTime();
      if (!Number.isNaN(ts)) {
        timestamps.push(ts);
      }
    }
  });

  if (!timestamps.length) return null;

  const earliest = Math.min(...timestamps);
  return new Date(earliest).toISOString().split("T")[0];
}
