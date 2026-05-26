"use client";
import { useState, forwardRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, TripPlan } from "@/lib/api";
import { Loader2, Plane, MapPin, Sun, Stamp, ExternalLink, Star, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Autocomplete, Suggestion } from "./Autocomplete";
import { useRegion } from "@/lib/region";

type Form = { origin: string; destination: string; depart: string; ret: string; pax: number };

const POPULAR_DESTS = ["Paris", "Tokyo", "Bali", "London", "New York"];
const POPULAR_AIRPORTS = ["new", "lon", "par", "tok"];

const Planner = forwardRef<HTMLDivElement>((_, ref) => {
  const today = new Date();
  const d7 = new Date(today.getTime() + 7 * 86400000);
  const d10 = new Date(today.getTime() + 10 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const { region, format } = useRegion();

  const [form, setForm] = useState<Form>({
    origin: "JFK", destination: "Paris",
    depart: iso(d7), ret: iso(d10),
    pax: 2,
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"flights" | "hotels" | "attractions">("flights");

  const update = (k: keyof Form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Prefetch on idle when destination + dates valid.
  useEffect(() => {
    if (!form.destination || form.destination.length < 3) return;
    const t = setTimeout(() => {
      api.weather({ city: form.destination }).catch(() => {});
      api.attractions({ city: form.destination, limit: 6 }).catch(() => {});
      api.visa({ nationality: region.nationality, destination: form.destination }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [form.destination, region.nationality]);

  async function go() {
    setLoading(true); setErr(null); setPlan(null);
    try {
      const data = await api.plan({
        origin: form.origin, destination: form.destination,
        depart: form.depart, ret: form.ret, pax: form.pax,
        nationality: region.nationality,
      });
      setPlan(data);
    } catch (e: any) {
      setErr(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const airportFetcher = async (q: string): Promise<Suggestion[]> => {
    const r = await api.suggestAirports(q);
    return r.map((a) => ({
      id: a.iata,
      primary: `${a.city} — ${a.name}`,
      secondary: a.country,
      hint: a.iata,
      raw: a,
    }));
  };

  const cityFetcher = async (q: string): Promise<Suggestion[]> => {
    const r = await api.suggestCities(q);
    return r.map((c) => ({
      id: `${c.name}-${c.country ?? ""}-${c.lat ?? ""}`,
      primary: c.name,
      secondary: [c.admin1, c.country].filter(Boolean).join(", "),
      hint: c.country,
      raw: c,
    }));
  };

  return (
    <section ref={ref} id="plan" className="section-pad relative">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-mist/40 mb-4">Plan your next escape</div>
          <h2 className="h-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
            Search the <span className="italic txt-gradient">whole trip</span> at once.
          </h2>
          <p className="mt-4 text-sm text-mist/50">
            Prices shown in <span className="font-mono text-mist/80">{region.currency}</span> · region {region.flag} {region.label}
          </p>
        </div>

        <div className="glass rounded-3xl p-4 md:p-6 ring-1 ring-white/10 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            <Autocomplete
              label="From"
              value={form.origin}
              onChange={(v) => update("origin", v.toUpperCase().slice(0, 24))}
              onSelect={(s) => update("origin", s.raw.iata)}
              fetcher={airportFetcher}
              placeholder="JFK or city"
              prefetchQueries={POPULAR_AIRPORTS}
              className="lg:col-span-1"
            />
            <Autocomplete
              label="Destination"
              value={form.destination}
              onChange={(v) => update("destination", v)}
              onSelect={(s) => update("destination", s.raw.name)}
              fetcher={cityFetcher}
              placeholder="Paris, Tokyo, Bali…"
              minChars={2}
              prefetchQueries={POPULAR_DESTS}
              className="lg:col-span-2"
            />
            <Field label="Depart" type="date" value={form.depart} onChange={(v) => update("depart", v)} />
            <Field label="Return" type="date" value={form.ret} onChange={(v) => update("ret", v)} />
            <Field label="Travelers" type="number" value={String(form.pax)} onChange={(v) => update("pax", Math.max(1, Number(v) || 1))} />
            <Field label="Currency" value={region.currency} readOnly />
          </div>
          <button
            onClick={go}
            disabled={loading || !form.destination}
            className="mt-4 group relative w-full overflow-hidden rounded-2xl bg-mist py-4 text-ink font-medium hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              {loading ? "Scraping the web…" : "Plan trip"}
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-coral via-plum to-aurora opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition duration-500" />
          </button>
          {err && <div className="mt-3 text-sm text-coral">⚠ {err}</div>}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-mist/40">
            <span className="uppercase tracking-widest">Popular:</span>
            {POPULAR_DESTS.map((d) => (
              <button
                key={d}
                onClick={() => update("destination", d)}
                className="rounded-full bg-white/5 hover:bg-white/10 px-3 py-1 text-mist/70 transition"
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-8"
            >
              <TopStrip plan={plan} />
              <div className="flex gap-2 flex-wrap">
                {(["flights", "hotels", "attractions"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-full px-5 py-2 text-sm capitalize transition",
                      tab === t ? "bg-mist text-ink" : "glass hover:bg-white/10"
                    )}
                  >
                    {t} ({plan[t].length})
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35 }}
                >
                  {tab === "flights" && <FlightsList plan={plan} format={format} />}
                  {tab === "hotels" && <HotelsList plan={plan} format={format} />}
                  {tab === "attractions" && <AttractionsList plan={plan} />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});
Planner.displayName = "Planner";
export default Planner;

function Field({
  label, value, onChange, type = "text", placeholder, className, readOnly,
}: { label: string; value: string; onChange?: (v: string) => void; type?: string; placeholder?: string; className?: string; readOnly?: boolean }) {
  return (
    <label className={cn(
      "rounded-xl bg-white/[0.03] ring-1 ring-white/10 px-4 py-2.5 block transition",
      !readOnly && "focus-within:ring-mist/40",
      readOnly && "opacity-80",
      className
    )}>
      <div className="text-[10px] uppercase tracking-[0.25em] text-mist/40">{label}</div>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 w-full bg-transparent outline-none text-mist placeholder:text-mist/30"
      />
    </label>
  );
}

function TopStrip({ plan }: { plan: TripPlan }) {
  const w = plan.weather; const v = plan.visa;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {w && (
        <div className="glass rounded-2xl p-6 flex items-start gap-5">
          <div className="text-5xl shrink-0">{w.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.3em] text-mist/40 mb-1 flex items-center gap-2"><Sun className="h-3.5 w-3.5" /> Weather · {w.city}</div>
            <div className="text-2xl md:text-3xl h-display">{Math.round(w.temp_c)}°C · {w.condition}</div>
            <div className="text-sm text-mist/60 mt-1">{w.humidity ?? "—"}% humidity · {w.wind_kph ?? "—"} kph wind</div>
            {w.forecast.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {w.forecast.slice(0, 7).map((d, i) => (
                  <div key={i} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs">
                    {d.icon} {Math.round(d.min_c)}/{Math.round(d.max_c)}°
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {v && (
        <div className="glass rounded-2xl p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-mist/40 mb-1 flex items-center gap-2"><Stamp className="h-3.5 w-3.5" /> Visa · {v.nationality} → {v.destination}</div>
          <div className="text-2xl h-display">{v.required ? "Visa required" : "No visa needed"}</div>
          <div className="mt-1 text-sm text-mist/70">{v.type}{v.duration_days ? ` · up to ${v.duration_days} days` : ""}</div>
          {v.notes && <div className="mt-3 text-sm text-mist/55">{v.notes}</div>}
        </div>
      )}
    </div>
  );
}

function FlightsList({ plan, format }: { plan: TripPlan; format: (n: number) => string }) {
  return (
    <div className="grid gap-3">
      {plan.flights.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
          className="glass rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 hover:bg-white/[0.06] transition group"
        >
          <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-coral shrink-0" />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 items-center min-w-0">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-mist/40">Airline</div>
              <div className="font-medium truncate">{f.airline}</div>
              {f.flight_no && <div className="text-xs text-mist/40">{f.flight_no}</div>}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-mist/40">Route</div>
              <div className="font-medium truncate">{f.origin} → {f.destination}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-mist/40">Times</div>
              <div className="font-medium truncate">{f.depart_time} – {f.arrive_time}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-mist/40">{f.duration}</div>
              <div className="font-medium truncate">{f.stops === 0 ? "Nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-mist/40">Price</div>
              <div className="h-display text-xl sm:text-2xl whitespace-nowrap">{format(f.price_usd)}</div>
            </div>
          </div>
          {f.deep_link && (
            <a href={f.deep_link} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition shrink-0">
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function HotelsList({ plan, format }: { plan: TripPlan; format: (n: number) => string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {plan.hotels.map((h, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          whileHover={{ y: -6, rotateX: 4, rotateY: -3 }}
          style={{ transformStyle: "preserve-3d" }}
          className="glass rounded-2xl overflow-hidden group"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {h.image && <img src={h.image} alt={h.name} className="h-full w-full object-cover group-hover:scale-110 transition duration-700" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
              <div className="rounded-full glass px-3 py-1 text-xs whitespace-nowrap">{format(h.price_usd)} / night</div>
              {h.rating && <div className="rounded-full glass px-3 py-1 text-xs flex items-center gap-1 whitespace-nowrap"><Star className="h-3 w-3 fill-current text-aurora" /> {h.rating}</div>}
            </div>
          </div>
          <div className="p-5">
            <div className="h-display text-xl mb-1 line-clamp-2">{h.name}</div>
            {h.address && <div className="text-xs text-mist/50 flex items-center gap-1 mb-2 truncate"><MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{h.address}</span></div>}
            <div className="flex gap-1.5 flex-wrap mt-3">
              {h.amenities.slice(0, 4).map((a, j) => (
                <span key={j} className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-mist/65">{a}</span>
              ))}
            </div>
            {h.deep_link && <a href={h.deep_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-aurora hover:underline">Book <ExternalLink className="h-3.5 w-3.5" /></a>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AttractionsList({ plan }: { plan: TripPlan }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {plan.attractions.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
          className="glass rounded-2xl overflow-hidden hover:ring-1 hover:ring-mist/30 transition"
        >
          <div className="aspect-square overflow-hidden">
            {a.image && <img src={a.image} alt={a.name} className="h-full w-full object-cover hover:scale-110 transition duration-700" />}
          </div>
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-mist/40">{a.category}</div>
            <div className="h-display text-lg mt-1 line-clamp-2">{a.name}</div>
            {a.rating && <div className="text-xs text-mist/60 mt-1">★ {a.rating} · {a.reviews?.toLocaleString()} reviews</div>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
