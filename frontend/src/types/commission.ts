// Commission and Earnings Types

export interface CommissionRate {
  perConversion: number;
  perTrialConversion: number;
  perPaidConversion: number;
  currency: string;
}

export interface EarningsBreakdown {
  fromTrials: number;
  fromPaid: number;
  total: number;
  currency: string;
}

export interface ReferralCodeWithEarnings {
  id: string;
  code: string;
  createdAt: string;
  conversions: number;
  trialConversions: number;
  paidConversions: number;
  status: 'active' | 'inactive';
  earnings: EarningsBreakdown;
}

