export type WalletBalance = {
  userId: string;
  availableCents: number;
  escrowedCents: number;
  currency: 'USD';
  updatedAt: string;
};

export type WalletTransactionType =
  | 'top_up'
  | 'escrow_hold'
  | 'escrow_release'
  | 'refund'
  | 'helper_payout'
  | 'platform_fee';

export type WalletTransaction = {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amountCents: number;
  currency: 'USD';
  referenceId?: string;
  note?: string;
  createdAt: string;
};
