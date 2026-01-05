export interface User {
  id: string;
  name: string;
  email: string;
  role: 'affiliate' | 'influencer';
  avatar?: string;
}

export interface ReferralCode {
  id: string;
  code: string;
  createdAt: string;
  conversions: number; // trial + paid conversions
  status: 'active' | 'inactive';
  trialConversions?: number;
  paidConversions?: number;
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

export interface DashboardStats {
  totalReferralCodes: number;
  totalConversions: number; // total trial + paid
  trialConversions: number;
  paidConversions: number;
}

export interface TimeSeriesData {
  date: string;
  conversions: number;
  trialConversions: number;
  paidConversions: number;
}
