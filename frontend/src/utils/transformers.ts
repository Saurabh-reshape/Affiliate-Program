import type {
  ReferralCode,
  DashboardStats,
  TimeSeriesData,
  ReferralStatus,
} from "../types";
import type { BackendReferral } from "../types/backend";
import type { CommissionRate } from "../types/commission";
import {
  calculateEarnings,
  // calculateAverageEarningsPerConversion,
} from "./earnings";

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
    trialConversions: 0,
    paidConversions: 0,
    totalEarnings: {
      fromTrials: 0,
      fromPaid: 0,
      total: 0,
      currency,
    },
  };
}

/**
 * Transform backend referral data to frontend format
 */
export function transformReferralCode(
  backendRef: BackendReferral,
  commissionRates?: CommissionRate
): ReferralCode {
  const now = new Date();
  const endDate = backendRef.endDate ? new Date(backendRef.endDate) : null;
  const startDate = backendRef.startDate
    ? new Date(backendRef.startDate)
    : null;
  const quota = typeof backendRef.quota === "number" ? backendRef.quota : null;
  const referralsCount = backendRef.referrals?.length ?? 0;

  // Determine status based on dates
  let status: ReferralStatus = "active";
  const inactiveBySchedule = Boolean(
    (endDate && endDate < now) || (startDate && startDate > now)
  );

  // Get conversions from purchase numbers (trial + paid)
  const trialConversions = backendRef.purchaseNumbers?.trial || 0;
  const paidConversions = backendRef.purchaseNumbers?.paid || 0;
  const conversions = trialConversions + paidConversions;
  const usageCount = Math.max(conversions, referralsCount);

  if (inactiveBySchedule) {
    status = "inactive";
  } else if (quota !== null && usageCount >= quota) {
    status = "exhausted";
  }

  // Calculate earnings if commission rates provided
  const earnings = commissionRates
    ? calculateEarnings(trialConversions, paidConversions, commissionRates)
    : undefined;

  return {
    id: backendRef._id,
    code: backendRef.referralCode,
    createdAt:
      backendRef.createdAt || backendRef.startDate || new Date().toISOString(),
    conversions,
    status,
    quota,
    referralsCount,
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
  backendRefs: BackendReferral[],
  commissionRates?: CommissionRate
): ReferralCode[] {
  return backendRefs.map((ref) => transformReferralCode(ref, commissionRates));
}

/**
 * Calculate dashboard stats from referral codes
 */
export function calculateDashboardStats(
  referralCodes: ReferralCode[]
): DashboardStats {
  const defaultCurrency =
    referralCodes.find((code) => code.earnings)?.earnings?.currency || "USD";

  const totals = referralCodes.reduce((acc, code) => {
    acc.totalConversions += code.conversions || 0;
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
      acc.totalEarnings.fromTrials += code.earnings.fromTrials;
      acc.totalEarnings.fromPaid += code.earnings.fromPaid;
      acc.totalEarnings.total += code.earnings.total;
      acc.totalEarnings.currency = code.earnings.currency;
    }

    return acc;
  }, createEmptyDashboardStats(defaultCurrency));

  // const averageEarningsPerConversion = calculateAverageEarningsPerConversion(
  //   totalEarnings.total,
  //   totalConversions
  // );

  return {
    totalReferralCodes: referralCodes.length,
    activeReferralCodes: totals.activeReferralCodes,
    inactiveReferralCodes: totals.inactiveReferralCodes,
    exhaustedReferralCodes: totals.exhaustedReferralCodes,
    totalConversions: totals.totalConversions,
    totalReferrals: totals.totalReferrals,
    trialConversions: totals.trialConversions,
    paidConversions: totals.paidConversions,
    totalEarnings: {
      fromTrials: Number(totals.totalEarnings.fromTrials.toFixed(2)),
      fromPaid: Number(totals.totalEarnings.fromPaid.toFixed(2)),
      total: Number(totals.totalEarnings.total.toFixed(2)),
      currency: totals.totalEarnings.currency,
    },
    // averageEarningsPerConversion,
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
      conversions: 0,
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
