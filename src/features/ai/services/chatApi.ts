import type { TranslationLanguageCode } from '../../../lib/translation/language';

export type AiChatRequest = {
  question: string;
  locale: TranslationLanguageCode;
  language: string;
  city: string;
  tripDays: number;
  tripStyle: string;
};

type AiChatResponse = {
  answer?: string;
  error?: string;
  model?: string;
};

const configuredEndpoint = process.env.EXPO_PUBLIC_AI_CHAT_ENDPOINT?.trim();
const defaultEndpoint = 'https://vinago.aiautotool.com/api/ai/chat';

export async function askTravelAi(input: AiChatRequest): Promise<{ answer: string; model?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(configuredEndpoint || defaultEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as AiChatResponse | null;
    if (!response.ok || !payload?.answer?.trim()) {
      throw new Error(payload?.error || `AI chat service returned HTTP ${response.status}`);
    }
    return { answer: payload.answer.trim(), model: payload.model };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI response timed out. Please try again.');
    }
    throw error instanceof Error ? error : new Error('Could not contact the AI assistant.');
  } finally {
    clearTimeout(timeout);
  }
}
