import { api } from './api';
import type { PublicLoyaltyCard, RedeemResponse } from '../types/loyalty';

export async function redeemCode(code: string): Promise<RedeemResponse> {
  const response = await api.post<RedeemResponse>('/loyalty/redeem', { code });
  return response.data;
}

export async function getPublicCard(token: string): Promise<PublicLoyaltyCard> {
  const response = await api.get<{ data: PublicLoyaltyCard }>(`/loyalty/cards/${encodeURIComponent(token)}`);
  return response.data.data;
}
