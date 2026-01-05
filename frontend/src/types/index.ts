export interface User {
  id: string;
  name: string;
  email: string;
  role: 'affiliate' | 'influencer';
  avatar?: string;
}

import type { EarningsBreakdown } from './commission';

export interface ReferralCode {
  id: string;
  code: string;
  createdAt: string;
  conversions: number; // trial + paid conversions
  status: 'active' | 'inactive';
  trialConversions?: number;
  paidConversions?: number;
  earnings?: EarningsBreakdown; // Calculated earnings for this code
}

export interface ReferralEvent {
  id: string;
  referralCodeId: string;
  type: 'click' | 'conversion' | 'signup';
  timestamp: string;
  userAgent?: string;
  ip?: string;
  revenue?: number;
}

import type { EarningsBreakdown } from './commission';

export interface DashboardStats {
  totalReferralCodes: number;
  totalConversions: number; // total trial + paid
  trialConversions: number;
  paidConversions: number;
  totalEarnings: EarningsBreakdown; // Total income
  averageEarningsPerConversion: number;
}

export interface TimeSeriesData {
  date: string;
  conversions: number;
  trialConversions: number;
  paidConversions: number;
}
