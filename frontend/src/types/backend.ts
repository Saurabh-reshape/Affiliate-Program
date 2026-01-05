// Backend API Response Types

export interface BackendReferral {
  _id: string;
  referralCode: string;
  quota?: number;
  noOfDays: number;
  startDate?: string;
  endDate?: string;
  referrer?: string | null;
  referrals: Array<{
    referred: string;
    _id?: string;
    oneMealLoggedDate?: string;
    freePremiumSubscriptionDate?: string;
    twoMealsLoggedDate?: string;
    tenMealsLoggedDate?: string;
    firstPaymentDate?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  purchaseNumbers?: {
    trial: number;
    paid: number;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface BackendApiResponse<T> {
  message: string;
  success: boolean;
  data: T;
}

