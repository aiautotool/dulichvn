export type PaymentProviderName = 'google_play' | 'apple_iap' | 'stripe' | 'demo';

export type LivePreviewPurchase = {
  provider: PaymentProviderName;
  productId: string;
  purchaseToken: string;
  orderId?: string | null;
  transactionId?: string | null;
  amountCents: number;
  currency: 'USD';
  purchasedAt: string;
  rawReceipt?: string | null;
};

export interface LivePreviewPaymentProvider {
  readonly provider: PaymentProviderName;
  initialize(): Promise<void>;
  purchaseLivePreviewSession(): Promise<LivePreviewPurchase>;
}
