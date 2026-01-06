// Commission and Earnings Types

export interface CommissionRate {
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
  trialConversions: number;
  paidConversions: number;
  status: "active" | "inactive" | "exhausted";
  earnings: EarningsBreakdown;
}
