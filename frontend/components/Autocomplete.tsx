"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { useDebounced } from "@/lib/useDebounced";
import { cn } from "@/lib/cn";

export type Suggestion = {
  id: string;
  primary: string;
  secondary?: string;
  hint?: string;
  raw: any;
};

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: Suggestion) => void;
  fetcher: (q: string) => Promise<Suggestion[]>;
  placeholder?: string;
  className?: string;
  minChars?: number;
  prefetchQueries?: string[];
  seedSuggestions?: Suggestion[];
};

const cache = new Map<string, Suggestion[]>();
const pool = new Map<string, Suggestion[]>();  // label -> aggregated prefetched items

function poolFilter(label: string, q: string, limit = 10): Suggestion[] {
  const items = pool.get(label) || [];
  if (!items.length) return [];
  const ql = q.toLowerCase();
  return items
    .filter((it) =>
      it.primary.toLowerCase().includes(ql) ||
      (it.secondary || "").toLowerCase().includes(ql) ||
      (it.hint || "").toLowerCase().includes(ql) ||
      it.id.toLowerCase().includes(ql)
    )
    .slice(0, limit);
}

function poolAdd(label: string, items: Suggestion[]) {
  const cur = pool.get(label) || [];
  const seen = new Set(cur.map((i) => i.id));
  for (const it of items) {
    if (!seen.has(it.id)) { cur.push(it); seen.add(it.id); }
  }
  pool.set(label, cur);
}

export function Autocomplete({
  label, value, onChange, onSelect, fetcher,
  placeholder, className, minChars = 1, prefetchQueries = [], seedSuggestions = [],
}: Props) {
  // Seed pool synchronously the first time this label is mounted so suggestions
  // are available before any network request returns.
  if (seedSuggestions.length && !pool.has(label)) {
    poolAdd(label, seedSuggestions);
  }

  const [focused, setFocused] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(value, 180);

  const run = useCallback(async (q: string) => {
    // Empty input: show pooled prefetched suggestions.
    if (q.length === 0) {
      setItems((pool.get(label) || []).slice(0, 10));
      return;
    }

    // Below minChars: instant local filter against pooled prefetched items.
    if (q.length < minChars) {
      setItems(poolFilter(label, q));
      return;
    }

    const key = `${label}::${q.toLowerCase()}`;
    if (cache.has(key)) { setItems(cache.get(key)!); return; }

    // Show pooled partial matches immediately while we fetch fresh.
    const instant = poolFilter(label, q);
    if (instant.length) setItems(instant);

    setLoading(true);
    try {
      const r = await fetcher(q);
      cache.set(key, r);
      poolAdd(label, r);
      setItems(r.length ? r : instant);
    } catch {
      setItems(instant);
    } finally {
      setLoading(false);
    }
  }, [fetcher, minChars, label]);

  useEffect(() => { run(debounced); }, [debounced, run]);

  // Prefetch common queries on mount; pool all results so partial typing matches instantly.
  useEffect(() => {
    prefetchQueries.forEach((q) => {
      const key = `${label}::${q.toLowerCase()}`;
      if (cache.has(key)) { poolAdd(label, cache.get(key)!); return; }
      fetcher(q)
        .then((r) => { cache.set(key, r); poolAdd(label, r); })
        .catch(() => {});
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(s: Suggestion) {
    onSelect?.(s);
    setFocused(false);
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent) {
    if (!focused || items.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
    else if (e.key === "Enter") { e.preventDefault(); pick(items[active]); }
    else if (e.key === "Escape") { setFocused(false); }
  }

  const open = focused && (items.length > 0 || loading);

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <label className="rounded-xl bg-cream border border-ink/15 px-4 py-2.5 block focus-within:border-ink/40 focus-within:shadow-sm transition">
        <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist flex items-center justify-between">
          <span>{label}</span>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-inkmist" />}
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); setActive(0); }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="mt-0.5 w-full bg-transparent outline-none text-ink placeholder:text-ink/30"
        />
      </label>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            style={{ backgroundColor: "rgba(255,249,238,0.98)", backdropFilter: "blur(10px)" }}
            className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-ink/15 shadow-xl overflow-hidden z-[80]"
          >
            <div className="max-h-72 overflow-y-auto py-1">
              {items.length === 0 && !loading && (
                <div className="px-4 py-3 text-sm text-inkmist flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" /> No matches
                </div>
              )}
              {items.map((s, i) => (
                <button
                  key={s.id}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 flex items-center gap-3 transition",
                    active === i ? "bg-paper" : "hover:bg-paper/60"
                  )}
                >
                  {s.hint && <span className="text-xs font-mono rounded bg-paper border border-ink/15 text-ink px-2 py-1">{s.hint}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm text-ink">{s.primary}</div>
                    {s.secondary && <div className="text-xs text-inkmist truncate">{s.secondary}</div>}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
