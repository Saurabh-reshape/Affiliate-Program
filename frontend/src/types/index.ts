import type { EarningsBreakdown } from "./commission";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "affiliate" | "influencer";
  avatar?: string;
  createdAt?: string; // User's joining/registration date
}

export type ReferralStatus = "active" | "inactive" | "exhausted";

export interface ReferralCode {
  id: string;
  code: string;
  createdAt: string;
  conversions: number; // trial + paid conversions
  status: ReferralStatus;
  quota?: number | null;
  referralsCount: number;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number;
  trialConversions?: number;
  paidConversions?: number;
  earnings?: EarningsBreakdown; // Calculated earnings for this code
}

export interface ReferralEvent {
  id: string;
  referralCodeId: string;
  type: "click" | "conversion" | "signup";
  timestamp: string;
  userAgent?: string;
  ip?: string;
  revenue?: number;
}

export interface DashboardStats {
  totalReferralCodes: number;
  activeReferralCodes: number;
  inactiveReferralCodes: number;
  exhaustedReferralCodes: number;
  totalConversions: number;
  totalReferrals: number;
  trialConversions: number;
  paidConversions: number;
  totalEarnings: EarningsBreakdown; // Total income
  // averageEarningsPerConversion: number;
}

export interface TimeSeriesData {
  date: string;
  conversions: number;
  trialConversions: number;
  paidConversions: number;
}
