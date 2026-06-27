'use client';

/**
 * Language + RTL provider for the agency dashboard.
 *
 * Wraps the framework-agnostic `@dzrent/i18n` core in a React context and keeps
 * `document.documentElement` `lang`/`dir` in sync so Arabic produces a true
 * layout mirror (design handoff §3.2), not merely right-aligned text.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANG,
  createTranslator,
  dirOf,
  type Dir,
  type Lang,
  type StringKey,
} from '@dzrent/i18n';

interface LangContextValue {
  lang: Lang;
  dir: Dir;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const dir = dirOf(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const t = useMemo(() => createTranslator(lang), [lang]);

  const value = useMemo<LangContextValue>(() => ({ lang, dir, setLang, t }), [lang, dir, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within <LangProvider>');
  return ctx;
}
