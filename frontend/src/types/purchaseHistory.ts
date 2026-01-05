// Purchase History Event Types
export interface PurchaseEvent {
  event_timestamp_ms: number;
  product_id: string;
  period_type: 'TRIAL' | 'NORMAL';
  purchased_at_ms: number;
  expiration_at_ms: number;
  environment: string;
  entitlement_id: string | null;
  entitlement_ids: string[];
  presented_offering_id: string | null;
  transaction_id: string;
  original_transaction_id: string;
  is_family_share: boolean;
  country_code: string;
  app_user_id: string;
  aliases: string[];
  original_app_user_id: string;
  currency: string;
  price: number;
  price_in_purchased_currency: number;
  subscriber_attributes?: {
    $email?: {
      updated_at_ms: number;
      value: string;
    };
  };
  store: string;
  takehome_percentage: number;
  tax_percentage: number;
  commission_percentage: number;
  offer_code: string | null;
  type: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'SUBSCRIPTION_PAUSED' | string;
  id: string;
  app_id: string;
  experiments?: Array<{
    experiment_id: string;
    experiment_variant: string;
    enrolled_at_ms: number;
  }>;
  auto_resume_at_ms?: number;
}

export interface PurchaseHistoryRecord {
  id: string;
  userId: string;
  event: string | PurchaseEvent[]; // Can be JSON string or parsed array
  createdAt: string;
  updatedAt: string;
}

