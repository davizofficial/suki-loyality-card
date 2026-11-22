export interface RedeemResponse {
  success: boolean;
  message: string;
  data: {
    card_public_token: string;
    stamp_balance: number;
    stamp_added: number;
    reward_available: boolean;
  };
}

export interface PublicLoyaltyCard {
  card_code: string;
  card_public_token: string;
  customer_name: string;
  stamp_balance: number;
  stamp_target: number;
  reward_available: boolean;
  reward_name: string;
}

export interface AdminDashboardSummary {
  customers: number;
  transactions: number;
  stamps_issued: number;
  rewards_redeemed: number;
}

export interface AdminCardInfo {
  id?: number;
  card_code: string;
  public_token?: string;
  status?: string;
}

export interface AdminCustomer {
  id: number;
  customer_code: string;
  name: string;
  whatsapp_number: string;
  email: string | null;
  notes: string | null;
  stamp_balance?: number;
  card: AdminCardInfo | null;
  created_at: string;
}

export interface AdminTransactionItemInput {
  product_name: 'Mango Juice' | 'Mango Smoothies';
  variant_size: '16 oz' | '18 oz';
  quantity_paid: number;
  quantity_free: number;
  unit_price: number;
}

export interface AdminTransactionItem extends AdminTransactionItemInput {
  id: number;
  subtotal: number;
}

export interface AdminTransaction {
  id: number;
  transaction_code: string;
  customer_id: number;
  sales_channel: 'pre_order' | 'market_day';
  total_amount: number;
  status: 'recorded' | 'completed';
  completed_at: string | null;
  created_at: string;
  customer?: {
    id: number;
    name: string;
    whatsapp_number: string;
  };
  items: AdminTransactionItem[];
  redeem_code?: {
    id: number;
    stamp_quantity: number;
    status: 'unused' | 'redeemed' | 'expired';
    redeemed_at: string | null;
  } | null;
}

export interface CompleteTransactionResult {
  channel: 'pre_order' | 'market_day';
  stamp_added?: number;
  stamp_balance?: number;
  stamp_quantity?: number;
  redeem_code: string | null;
  customer_whatsapp?: string;
}

export interface AdminScanResult {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  whatsapp_number: string;
  card_code: string;
  stamp_balance: number;
}
