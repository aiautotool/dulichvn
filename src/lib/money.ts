export const LIVE_PREVIEW_PRICE_CENTS = 100;
export const LIVE_PREVIEW_PLATFORM_FEE_CENTS = 20;
export const LIVE_PREVIEW_HELPER_REWARD_CENTS = 80;

export type MoneySplit = {
  priceCents: number;
  platformFeeCents: number;
  helperRewardCents: number;
  priceUsd: number;
  platformFeeUsd: number;
  helperRewardUsd: number;
};

export function centsToUsd(cents: number): number {
  return Math.round(cents) / 100;
}

export function formatUsdFromCents(cents: number): string {
  return `$${centsToUsd(cents).toFixed(2)}`;
}

export function createLivePreviewMoneySplit(
  priceCents = LIVE_PREVIEW_PRICE_CENTS,
  platformFeeCents = LIVE_PREVIEW_PLATFORM_FEE_CENTS,
): MoneySplit {
  const helperRewardCents = Math.max(0, priceCents - platformFeeCents);
  return {
    priceCents,
    platformFeeCents,
    helperRewardCents,
    priceUsd: centsToUsd(priceCents),
    platformFeeUsd: centsToUsd(platformFeeCents),
    helperRewardUsd: centsToUsd(helperRewardCents),
  };
}
