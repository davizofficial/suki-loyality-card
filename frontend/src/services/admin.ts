import { api } from './api';
import type {
  AdminCustomer,
  AdminDashboardSummary,
  AdminScanResult,
  AdminTransaction,
  AdminTransactionItemInput,
  CompleteTransactionResult,
} from '../types/loyalty';

export async function adminLogout(): Promise<void> {
  try {
    await api.post('/admin/auth/logout');
  } finally {
    sessionStorage.removeItem('suki_admin_token');
  }
}

export async function getAdminDashboard(): Promise<AdminDashboardSummary> {
  const res = await api.get<{ data: AdminDashboardSummary }>('/admin/dashboard');
  return res.data.data;
}

export async function getAdminCustomers(search = ''): Promise<AdminCustomer[]> {
  const res = await api.get<{ data: AdminCustomer[] }>('/admin/customers', {
    params: search.trim() ? { search: search.trim() } : undefined,
  });
  return res.data.data;
}

export async function createAdminCustomer(payload: {
  name: string;
  whatsapp_number: string;
  email?: string;
  notes?: string;
}): Promise<{ customer: AdminCustomer; card: { card_code: string; public_token: string; card_url: string } }> {
  const res = await api.post<{
    data: { customer: AdminCustomer; card: { card_code: string; public_token: string; card_url: string } };
  }>('/admin/customers', payload);
  return res.data.data;
}

export async function getAdminTransactions(): Promise<AdminTransaction[]> {
  const res = await api.get<{ data: AdminTransaction[] }>('/admin/transactions');
  return res.data.data;
}

export async function createAdminTransaction(payload: {
  customer_id: number;
  sales_channel: 'pre_order' | 'market_day';
  items: AdminTransactionItemInput[];
}): Promise<AdminTransaction> {
  const res = await api.post<{ data: AdminTransaction }>('/admin/transactions', payload);
  return res.data.data;
}

export async function completeAdminTransaction(transactionId: number): Promise<CompleteTransactionResult> {
  const res = await api.post<{ data: CompleteTransactionResult }>(`/admin/transactions/${transactionId}/complete`);
  return res.data.data;
}

export async function scanLoyaltyCard(token: string): Promise<AdminScanResult> {
  const res = await api.get<{ data: AdminScanResult }>(`/admin/loyalty/scan/${encodeURIComponent(token)}`);
  return res.data.data;
}

export async function adjustCustomerStamps(payload: {
  customer_id: number;
  stamp_delta: number;
  description: string;
}): Promise<void> {
  await api.post('/admin/loyalty/stamps/adjust', payload);
}

export async function redeemCustomerReward(customerId: number): Promise<{ message: string; stamp_balance: number }> {
  const res = await api.post<{ message: string; stamp_balance: number }>('/admin/rewards/redeem', {
    customer_id: customerId,
  });
  return res.data;
}
