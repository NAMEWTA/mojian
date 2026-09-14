import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  getLocale,
  initLocale,
  setLocale,
  subscribeLocale,
  translate,
  type Locale,
} from "./core";
import { en } from "./en";
import { zh } from "./zh";

const tables: Record<Locale, Record<string, string>> = { zh, en };

let started = false;
export function ensureI18n() {
  started = true;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  ensureI18n();
  return translate(tables[getLocale()], zh, key, vars);
}

export function tLocale(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  return translate(tables[locale], zh, key, vars);
}

export function useI18n() {
  ensureI18n();
  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => "zh" as Locale);
  return {
    locale,
    setLocale,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(tables[locale], zh, key, vars),
  };
}

export function I18nBoot({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  useEffect(() => {
    initLocale();
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = t("app.name");
  }, [locale]);
  return children;
}

export type { Locale };
export { setLocale, getLocale, initLocale };
