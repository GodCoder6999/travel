"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Region = {
  code: string;
  label: string;
  flag: string;
  currency: string;
  locale: string;
  nationality: string;
};

export const REGIONS: Region[] = [
  { code: "US", label: "United States", flag: "🇺🇸", currency: "USD", locale: "en-US", nationality: "US" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧", currency: "GBP", locale: "en-GB", nationality: "GB" },
  { code: "EU", label: "Eurozone", flag: "🇪🇺", currency: "EUR", locale: "en-IE", nationality: "DE" },
  { code: "IN", label: "India", flag: "🇮🇳", currency: "INR", locale: "en-IN", nationality: "IN" },
  { code: "JP", label: "Japan", flag: "🇯🇵", currency: "JPY", locale: "ja-JP", nationality: "JP" },
  { code: "AE", label: "UAE", flag: "🇦🇪", currency: "AED", locale: "en-AE", nationality: "AE" },
  { code: "SG", label: "Singapore", flag: "🇸🇬", currency: "SGD", locale: "en-SG", nationality: "SG" },
  { code: "AU", label: "Australia", flag: "🇦🇺", currency: "AUD", locale: "en-AU", nationality: "AU" },
  { code: "CA", label: "Canada", flag: "🇨🇦", currency: "CAD", locale: "en-CA", nationality: "CA" },
  { code: "KR", label: "Korea", flag: "🇰🇷", currency: "KRW", locale: "ko-KR", nationality: "KR" },
  { code: "BR", label: "Brazil", flag: "🇧🇷", currency: "BRL", locale: "pt-BR", nationality: "BR" },
  { code: "MX", label: "Mexico", flag: "🇲🇽", currency: "MXN", locale: "es-MX", nationality: "MX" },
  { code: "CN", label: "China", flag: "🇨🇳", currency: "CNY", locale: "zh-CN", nationality: "CN" },
  { code: "CH", label: "Switzerland", flag: "🇨🇭", currency: "CHF", locale: "de-CH", nationality: "CH" },
  { code: "TH", label: "Thailand", flag: "🇹🇭", currency: "THB", locale: "th-TH", nationality: "TH" },
];

type RegionContextValue = {
  region: Region;
  setRegion: (r: Region) => void;
  rates: Record<string, number>;
  format: (priceUsd: number, opts?: { decimals?: number }) => string;
  convert: (priceUsd: number) => number;
};

const RegionContext = createContext<RegionContextValue | null>(null);

const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.78, JPY: 156, INR: 84, AUD: 1.50, CAD: 1.36,
  AED: 3.67, SGD: 1.34, THB: 36.5, BRL: 5.10, CNY: 7.10, KRW: 1350,
  MXN: 18.5, CHF: 0.90,
};

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(REGIONS[0]);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("voyage:region") : null;
    if (saved) {
      const r = REGIONS.find((x) => x.code === saved);
      if (r) setRegionState(r);
    } else if (typeof navigator !== "undefined") {
      const lang = (navigator.language || "en-US").toUpperCase();
      const guess = REGIONS.find((x) => lang.endsWith(x.code));
      if (guess) setRegionState(guess);
    }
    fetch("/api/fx")
      .then((r) => r.json())
      .then((d) => { if (d?.rates) setRates({ ...FALLBACK_RATES, ...d.rates }); })
      .catch(() => {});
  }, []);

  const setRegion = (r: Region) => {
    setRegionState(r);
    try { localStorage.setItem("voyage:region", r.code); } catch {}
  };

  const value = useMemo<RegionContextValue>(() => {
    const convert = (usd: number) => usd * (rates[region.currency] ?? 1);
    const format = (usd: number, opts?: { decimals?: number }) => {
      const v = convert(usd);
      const dec = opts?.decimals ?? (region.currency === "JPY" || region.currency === "KRW" ? 0 : 0);
      try {
        return new Intl.NumberFormat(region.locale, {
          style: "currency", currency: region.currency,
          maximumFractionDigits: dec, minimumFractionDigits: dec,
        }).format(v);
      } catch {
        return `${region.currency} ${Math.round(v)}`;
      }
    };
    return { region, setRegion, rates, format, convert };
  }, [region, rates]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion outside RegionProvider");
  return ctx;
}
