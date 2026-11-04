'use client';

/**
 * Language + RTL provider for the client website.
 *
 * Merges the shared `@dzrent/i18n` dictionary with the client-only strings and
 * keeps `<html lang/dir>` in sync, so Arabic is a true layout mirror (design
 * handoff §3.2). The choice persists in localStorage.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANG, STR, dirOf, type Dir, type Lang, type StringKey } from '@dzrent/i18n';
import { CLIENT_STR, type ClientStringKey } from './strings';

export type Key = StringKey | ClientStringKey;

interface LangContextValue {
  lang: Lang;
  dir: Dir;
  setLang: (lang: Lang) => void;
  t: (key: Key) => string;
  /** Pick the right side of a `{ fr, ar }`-style pair coming from the API. */
  pick: (fr: string, ar?: string | null) => string;
}

const LangContext = createContext<LangContextValue | null>(null);
const STORAGE_KEY = 'dzrent.lang';

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const dir = dirOf(lang);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'ar') setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: Key) => {
      const entry =
        (CLIENT_STR as Record<string, { fr: string; ar: string }>)[key] ??
        (STR as Record<string, { fr: string; ar: string }>)[key];
      return entry ? entry[lang] : key;
    },
    [lang],
  );

  const pick = useCallback(
    (fr: string, ar?: string | null) => (lang === 'ar' && ar ? ar : fr),
    [lang],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, dir, setLang, t, pick }),
    [lang, dir, setLang, t, pick],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within <LangProvider>');
  return ctx;
}
