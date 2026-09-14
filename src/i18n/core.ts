export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];

type Vars = Record<string, string | number>;

let locale: Locale = "zh";
const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh";
  const saved = window.localStorage.getItem("mojian-locale");
  if (saved === "zh" || saved === "en") return saved;
  const lang = window.navigator.language.toLowerCase();
  return lang.startsWith("zh") ? "zh" : "en";
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale) {
  locale = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("mojian-locale", next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  }
  listeners.forEach((fn) => fn());
}

export function subscribeLocale(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initLocale() {
  setLocale(readStoredLocale());
}

function lookup(table: Record<string, string>, key: string): string {
  return table[key] ?? key;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name]),
  );
}

export function translate(
  table: Record<string, string>,
  fallback: Record<string, string>,
  key: string,
  vars?: Vars,
): string {
  return interpolate(lookup(table, key) || lookup(fallback, key), vars);
}
