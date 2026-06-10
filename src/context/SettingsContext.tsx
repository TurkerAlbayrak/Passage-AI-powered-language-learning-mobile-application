import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CefrApi } from '../api/cefr';
import { DEFAULT_API_BASE_URL } from '../config';
import { loadApiBaseUrl, saveApiBaseUrl } from '../storage';

interface SettingsContextValue {
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => Promise<void>;
  api: CefrApi;
  ready: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiBaseUrl, setUrl] = useState(DEFAULT_API_BASE_URL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await loadApiBaseUrl();
      if (stored) setUrl(stored);
      setReady(true);
    })();
  }, []);

  const setApiBaseUrl = useCallback(async (url: string) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    setUrl(trimmed);
    await saveApiBaseUrl(trimmed);
  }, []);

  const api = useMemo(() => new CefrApi(apiBaseUrl), [apiBaseUrl]);

  const value = useMemo(
    () => ({ apiBaseUrl, setApiBaseUrl, api, ready }),
    [apiBaseUrl, setApiBaseUrl, api, ready],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
