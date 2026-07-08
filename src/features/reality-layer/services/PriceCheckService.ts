import type { PriceReport } from '../types';

export type PriceCheckResult = {
  status: 'fair' | 'high' | 'too_high' | 'insufficient_data';
  median?: number;
  low?: number;
  high?: number;
  message: string;
  sampleSize: number;
};

export class PriceCheckService {
  checkPrice(itemName: string, quotedPrice: number, reports: PriceReport[], minSamples = 3): PriceCheckResult {
    const normalized = this.normalize(itemName);
    const samples = reports
      .filter((report) => report.verified && report.normalizedItemName === normalized)
      .map((report) => report.price)
      .sort((a, b) => a - b);
    if (samples.length < minSamples) {
      return { status: 'insufficient_data', message: 'Not enough verified local price data yet.', sampleSize: samples.length };
    }
    const median = this.percentile(samples, 0.5);
    const low = this.percentile(samples, 0.2);
    const high = this.percentile(samples, 0.8);
    if (quotedPrice > high * 1.35) return { status: 'too_high', median, low, high, message: 'This quote is far above recent local reports.', sampleSize: samples.length };
    if (quotedPrice > high) return { status: 'high', median, low, high, message: 'This quote is higher than the expected range.', sampleSize: samples.length };
    return { status: 'fair', median, low, high, message: 'This quote is within the recent expected range.', sampleSize: samples.length };
  }

  normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
    return sorted[index];
  }
}
