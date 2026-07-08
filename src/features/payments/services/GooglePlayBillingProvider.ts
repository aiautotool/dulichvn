import { Platform } from 'react-native';
import { LIVE_PREVIEW_PRICE_CENTS } from '../../../lib/money';
import type { LivePreviewPaymentProvider, LivePreviewPurchase } from '../types';

export const GOOGLE_PLAY_LIVE_PREVIEW_PRODUCT_ID = 'live_preview_session_1';

type ReactNativeIapModule = {
  initConnection?: () => Promise<boolean>;
  endConnection?: () => Promise<void>;
  getProducts?: (args: { skus: string[] }) => Promise<unknown[]>;
  requestPurchase?: (args: { sku: string; skus?: string[] }) => Promise<unknown>;
  finishTransaction?: (args: { purchase: unknown; isConsumable?: boolean }) => Promise<unknown>;
};

function loadReactNativeIap(): ReactNativeIapModule | null {
  try {
    // Optional native dependency. Keep dynamic loading so web/iOS/dev builds still typecheck.
    // Install before production Android builds: npm install react-native-iap
    // Then create a Google Play Console consumable product: live_preview_session_1.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const dynamicRequire = eval('require') as (name: string) => ReactNativeIapModule;
    return dynamicRequire('react-native-iap');
  } catch {
    return null;
  }
}

function readStringField(value: unknown, field: string): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const raw = record[field];
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

function normalizePurchase(rawPurchase: unknown): LivePreviewPurchase {
  const purchaseToken =
    readStringField(rawPurchase, 'purchaseToken') ??
    readStringField(rawPurchase, 'transactionReceipt') ??
    readStringField(rawPurchase, 'transactionId');

  if (!purchaseToken) {
    throw new Error('google_play_purchase_token_missing');
  }

  return {
    provider: 'google_play',
    productId: GOOGLE_PLAY_LIVE_PREVIEW_PRODUCT_ID,
    purchaseToken,
    orderId: readStringField(rawPurchase, 'orderId'),
    transactionId: readStringField(rawPurchase, 'transactionId'),
    amountCents: LIVE_PREVIEW_PRICE_CENTS,
    currency: 'USD',
    purchasedAt: new Date().toISOString(),
    rawReceipt: readStringField(rawPurchase, 'transactionReceipt'),
  };
}

export class GooglePlayBillingProvider implements LivePreviewPaymentProvider {
  readonly provider = 'google_play' as const;
  private iap: ReactNativeIapModule | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('google_play_billing_android_only');
    }

    this.iap = loadReactNativeIap();
    if (!this.iap?.initConnection || !this.iap.requestPurchase || !this.iap.finishTransaction) {
      throw new Error('react_native_iap_not_installed');
    }

    await this.iap.initConnection();
    if (this.iap.getProducts) {
      await this.iap.getProducts({ skus: [GOOGLE_PLAY_LIVE_PREVIEW_PRODUCT_ID] });
    }
    this.initialized = true;
  }

  async purchaseLivePreviewSession(): Promise<LivePreviewPurchase> {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!this.iap?.requestPurchase || !this.iap.finishTransaction) {
      throw new Error('google_play_billing_not_ready');
    }

    const purchaseResult = await this.iap.requestPurchase({
      sku: GOOGLE_PLAY_LIVE_PREVIEW_PRODUCT_ID,
      skus: [GOOGLE_PLAY_LIVE_PREVIEW_PRODUCT_ID],
    });
    const rawPurchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
    const purchase = normalizePurchase(rawPurchase);

    await this.iap.finishTransaction({ purchase: rawPurchase, isConsumable: true });
    return purchase;
  }
}

export class DemoGooglePlayBillingProvider implements LivePreviewPaymentProvider {
  readonly provider = 'demo' as const;

  async initialize(): Promise<void> {}

  async purchaseLivePreviewSession(): Promise<LivePreviewPurchase> {
    return {
      provider: 'demo',
      productId: GOOGLE_PLAY_LIVE_PREVIEW_PRODUCT_ID,
      purchaseToken: `demo_gplay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      orderId: `demo_order_${Date.now()}`,
      transactionId: `demo_tx_${Date.now()}`,
      amountCents: LIVE_PREVIEW_PRICE_CENTS,
      currency: 'USD',
      purchasedAt: new Date().toISOString(),
      rawReceipt: null,
    };
  }
}
