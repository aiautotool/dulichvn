import type { TranslationLanguageCode } from '../../../lib/translation/language';

export type VisionAnalysisMode = 'food' | 'landmark' | 'sign' | 'ocr';

export type VisionAnalysis = {
  title: string;
  summary: string;
  extractedText: string;
  translation: string;
  confidence: 'high' | 'medium' | 'low';
  safetyNote: string;
  priceHint: string;
  model?: string;
};

type AnalyzeVisionInput = {
  imageBase64: string;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  mode: VisionAnalysisMode;
  locale: TranslationLanguageCode;
  city: string;
};

const configuredEndpoint = process.env.EXPO_PUBLIC_AI_VISION_ENDPOINT?.trim();
const defaultEndpoint = 'https://vinago.aiautotool.com/api/ai/vision';

export async function analyzeTravelImage(input: AnalyzeVisionInput): Promise<VisionAnalysis> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(configuredEndpoint || defaultEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as { analysis?: VisionAnalysis; error?: string; model?: string } | null;

    if (!response.ok || !payload?.analysis) {
      throw new Error(payload?.error || `Vision service returned HTTP ${response.status}`);
    }
    return { ...payload.analysis, model: payload.model };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Image analysis timed out. Please try again on a faster connection.');
    }
    throw error instanceof Error ? error : new Error('Could not analyze this image.');
  } finally {
    clearTimeout(timeout);
  }
}
