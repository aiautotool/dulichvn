export type PaymentEscrowLedgerEventType =
  | 'payment_intent_created'
  | 'captured_to_escrow'
  | 'released_to_helper'
  | 'refunded_to_traveler'
  | 'marked_disputed';

export type PaymentEscrowLedgerEvent = {
  id: string;
  requestId: string;
  type: PaymentEscrowLedgerEventType;
  amountCents: number;
  provider: 'mock' | 'stripe';
  providerReferenceId: string | null;
  createdAt: string;
};

export interface PaymentEscrowRepository {
  record(event: Omit<PaymentEscrowLedgerEvent, 'id' | 'createdAt'>): Promise<PaymentEscrowLedgerEvent>;
  listForRequest(requestId: string): Promise<PaymentEscrowLedgerEvent[]>;
}
