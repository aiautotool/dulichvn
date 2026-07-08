import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelectedLanguage, normalizeTranslationLanguage } from './language';
import { translateObject } from './translateData';

export function useTranslatedData<T>(sourceData: T) {
  const selectedLanguage = useAppSelectedLanguage();
  const targetLanguage = normalizeTranslationLanguage(selectedLanguage);
  const requestIdRef = useRef(0);
  const [state, setState] = useState<{
    data: T;
    error: Error | null;
    loading: boolean;
  }>({
    data: sourceData,
    error: null,
    loading: false,
  });

  const dependencyKey = useMemo(
    () => `${targetLanguage}:${stableDataKey(sourceData)}`,
    [sourceData, targetLanguage],
  );

  useEffect(() => {
    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (targetLanguage === 'vi') {
      setState({ data: sourceData, error: null, loading: false });
      return () => {
        cancelled = true;
      };
    }

    setState({
      data: sourceData,
      error: null,
      loading: true,
    });

    translateObject(sourceData, targetLanguage)
      .then((translatedData) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        setState({ data: translatedData, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        setState({
          data: sourceData,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [dependencyKey, sourceData, targetLanguage]);

  return state;
}

function stableDataKey(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
