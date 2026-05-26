"use client";
import { useState, forwardRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, TripPlan, Preferences, ItineraryDayItem } from "@/lib/api";
import {
  Loader2, Plane, MapPin, Sun, Stamp, ExternalLink, Star, Sparkles,
  ChevronLeft, ChevronRight, Calendar, Users, Check, Wallet, Gauge, Heart,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Autocomplete, Suggestion } from "./Autocomplete";
import { useRegion } from "@/lib/region";
import { TransportIcon } from "./TransportIcon";

type State = {
  origin: string;
  origin_label: string;
  destination: string;
  destination_label: string;
  depart: string;
  ret: string;
  pax: number;
  prefs: Required<Preferences>;
};

const POPULAR_DESTS = ["Paris", "Tokyo", "Bali", "London", "New York"];

const SEED_CITIES = [
  { name: "Paris", country: "FR", admin1: "Île-de-France" },
  { name: "London", country: "GB", admin1: "England" },
  { name: "New York", country: "US", admin1: "New York" },
  { name: "Tokyo", country: "JP", admin1: "Tokyo" },
  { name: "Bali", country: "ID", admin1: "Bali" },
  { name: "Bangkok", country: "TH", admin1: "Bangkok" },
  { name: "Dubai", country: "AE", admin1: "Dubai" },
  { name: "Singapore", country: "SG", admin1: "Singapore" },
  { name: "Rome", country: "IT", admin1: "Lazio" },
  { name: "Barcelona", country: "ES", admin1: "Catalonia" },
  { name: "Istanbul", country: "TR", admin1: "Istanbul" },
  { name: "Seoul", country: "KR", admin1: "Seoul" },
  { name: "Sydney", country: "AU", admin1: "New South Wales" },
  { name: "Cape Town", country: "ZA", admin1: "Western Cape" },
  { name: "Rio de Janeiro", country: "BR", admin1: "Rio de Janeiro" },
  { name: "Marrakech", country: "MA", admin1: "Marrakech-Safi" },
  { name: "Reykjavík", country: "IS", admin1: "Capital Region" },
  { name: "Kyoto", country: "JP", admin1: "Kyoto" },
  { name: "Lisbon", country: "PT", admin1: "Lisbon" },
  { name: "Amsterdam", country: "NL", admin1: "North Holland" },
  { name: "Prague", country: "CZ", admin1: "Prague" },
  { name: "Vienna", country: "AT", admin1: "Vienna" },
  { name: "Berlin", country: "DE", admin1: "Berlin" },
  { name: "Madrid", country: "ES", admin1: "Madrid" },
  { name: "Athens", country: "GR", admin1: "Attica" },
  { name: "Cairo", country: "EG", admin1: "Cairo" },
  { name: "Mumbai", country: "IN", admin1: "Maharashtra" },
  { name: "Delhi", country: "IN", admin1: "Delhi" },
  { name: "Kolkata", country: "IN", admin1: "West Bengal" },
  { name: "Bengaluru", country: "IN", admin1: "Karnataka" },
  { name: "Goa", country: "IN", admin1: "Goa" },
  { name: "Jaipur", country: "IN", admin1: "Rajasthan" },
];

const SEED_AIRPORTS = [
  { iata: "JFK", city: "New York", name: "John F. Kennedy Intl", country: "US" },
  { iata: "LAX", city: "Los Angeles", name: "Los Angeles Intl", country: "US" },
  { iata: "SFO", city: "San Francisco", name: "San Francisco Intl", country: "US" },
  { iata: "ORD", city: "Chicago", name: "O'Hare", country: "US" },
  { iata: "MIA", city: "Miami", name: "Miami Intl", country: "US" },
  { iata: "BOS", city: "Boston", name: "Logan", country: "US" },
  { iata: "SEA", city: "Seattle", name: "Sea-Tac", country: "US" },
  { iata: "LHR", city: "London", name: "Heathrow", country: "GB" },
  { iata: "LGW", city: "London", name: "Gatwick", country: "GB" },
  { iata: "CDG", city: "Paris", name: "Charles de Gaulle", country: "FR" },
  { iata: "FRA", city: "Frankfurt", name: "Frankfurt am Main", country: "DE" },
  { iata: "MUC", city: "Munich", name: "Munich", country: "DE" },
  { iata: "AMS", city: "Amsterdam", name: "Schiphol", country: "NL" },
  { iata: "MAD", city: "Madrid", name: "Barajas", country: "ES" },
  { iata: "BCN", city: "Barcelona", name: "El Prat", country: "ES" },
  { iata: "FCO", city: "Rome", name: "Fiumicino", country: "IT" },
  { iata: "IST", city: "Istanbul", name: "Istanbul", country: "TR" },
  { iata: "DXB", city: "Dubai", name: "Dubai Intl", country: "AE" },
  { iata: "DOH", city: "Doha", name: "Hamad Intl", country: "QA" },
  { iata: "SIN", city: "Singapore", name: "Changi", country: "SG" },
  { iata: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "TH" },
  { iata: "HKG", city: "Hong Kong", name: "Chek Lap Kok", country: "HK" },
  { iata: "HND", city: "Tokyo", name: "Haneda", country: "JP" },
  { iata: "NRT", city: "Tokyo", name: "Narita", country: "JP" },
  { iata: "ICN", city: "Seoul", name: "Incheon", country: "KR" },
  { iata: "SYD", city: "Sydney", name: "Kingsford Smith", country: "AU" },
  { iata: "DEL", city: "Delhi", name: "Indira Gandhi", country: "IN" },
  { iata: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji", country: "IN" },
  { iata: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose", country: "IN" },
  { iata: "BLR", city: "Bengaluru", name: "Kempegowda", country: "IN" },
  { iata: "MAA", city: "Chennai", name: "Chennai Intl", country: "IN" },
  { iata: "HYD", city: "Hyderabad", name: "Rajiv Gandhi", country: "IN" },
  { iata: "GOI", city: "Goa", name: "Dabolim", country: "IN" },
  { iata: "YYZ", city: "Toronto", name: "Pearson", country: "CA" },
  { iata: "GRU", city: "São Paulo", name: "Guarulhos", country: "BR" },
];

const seededCitySuggestions: Suggestion[] = SEED_CITIES.map((c) => ({
  id: `seed-${c.name}-${c.country}`,
  primary: c.name,
  secondary: `${c.admin1}, ${c.country}`,
  hint: c.country,
  raw: c,
}));

const seededAirportSuggestions: Suggestion[] = SEED_AIRPORTS.map((a) => ({
  id: `seed-${a.iata}`,
  primary: `${a.city} — ${a.name}`,
  secondary: a.country,
  hint: a.iata,
  raw: a,
}));

const VIBES = [
  { id: "relax", label: "Relax", emoji: "🌴" },
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "culture", label: "Culture", emoji: "🏛️" },
  { id: "foodie", label: "Foodie", emoji: "🍜" },
  { id: "nightlife", label: "Nightlife", emoji: "🌃" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "romance", label: "Romance", emoji: "🌹" },
];

const INTERESTS = [
  "museums", "art", "history", "parks", "nature", "beaches",
  "hiking", "shopping", "food", "nightlife", "family", "architecture",
];

const STEPS = ["Destination", "Travelers", "Preferences", "Review"] as const;

const TripWizard = forwardRef<HTMLDivElement>((_, ref) => {
  const today = new Date();
  const d7 = new Date(today.getTime() + 7 * 86400000);
  const d10 = new Date(today.getTime() + 10 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const { region, format } = useRegion();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>({
    origin: "JFK", origin_label: "JFK · New York",
    destination: "Paris", destination_label: "Paris",
    depart: iso(d7), ret: iso(d10), pax: 2,
    prefs: {
      budget: "mid", vibe: ["culture"], pace: "balanced",
      interests: ["history", "food"], nonstop_only: false,
      max_stops: 2, accessible: false,
      sort_flights_by: "best", sort_hotels_by: "best",
    },
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"itinerary" | "flights" | "hotels" | "attractions">("itinerary");

  const nights = useMemo(() => {
    try {
      const a = new Date(state.depart); const b = new Date(state.ret);
      return Math.max(1, Math.round((+b - +a) / 86400000));
    } catch { return 1; }
  }, [state.depart, state.ret]);

  function set<K extends keyof State>(k: K, v: State[K]) { setState((s) => ({ ...s, [k]: v })); }
  function setPref<K extends keyof Required<Preferences>>(k: K, v: Required<Preferences>[K]) {
    setState((s) => ({ ...s, prefs: { ...s.prefs, [k]: v } }));
  }
  function toggleArr(k: "vibe" | "interests", v: string) {
    setState((s) => {
      const arr = s.prefs[k] as string[];
      const has = arr.includes(v);
      return { ...s, prefs: { ...s.prefs, [k]: has ? arr.filter((x) => x !== v) : [...arr, v] } };
    });
  }

  const canNext = useMemo(() => {
    if (step === 0) return state.destination.length >= 2 && state.depart && state.ret;
    if (step === 1) return state.origin.length >= 2 && state.pax > 0;
    return true;
  }, [step, state]);

  // Prefetch ambient data on step 0/1.
  useEffect(() => {
    if (state.destination.length < 3) return;
    const t = setTimeout(() => {
      api.weather({ city: state.destination }).catch(() => {});
      api.visa({ nationality: region.nationality, destination: state.destination }).catch(() => {});
      api.attractions({ city: state.destination, limit: 12 }).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [state.destination, region.nationality]);

  const airportFetcher = async (q: string): Promise<Suggestion[]> => {
    const r = await api.suggestAirports(q);
    return r.map((a) => ({
      id: a.iata, primary: `${a.city} — ${a.name}`,
      secondary: a.country, hint: a.iata, raw: a,
    }));
  };
  const cityFetcher = async (q: string): Promise<Suggestion[]> => {
    const r = await api.suggestCities(q);
    return r.map((c) => ({
      id: `${c.name}-${c.country ?? ""}-${c.lat ?? ""}`,
      primary: c.name,
      secondary: [c.admin1, c.country].filter(Boolean).join(", "),
      hint: c.country, raw: c,
    }));
  };

  async function submit() {
    setLoading(true); setErr(null); setPlan(null);
    try {
      const data = await api.plan({
        origin: state.origin, destination: state.destination,
        depart: state.depart, ret: state.ret, pax: state.pax,
        nationality: region.nationality, preferences: state.prefs,
      });
      setPlan(data);
      setStep(STEPS.length);
      setTab("itinerary");
    } catch (e: any) {
      console.error("[plan] failed:", e);
      const msg = (e?.message || String(e)).slice(0, 240);
      setErr(`We couldn't build that trip just now. (${msg})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section ref={ref} id="plan" className="section-pad relative">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <div className="h-hand text-3xl text-coral mb-2">— my next trip —</div>
          <h2 className="h-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-balance text-ink">
            Tell us how you <span className="italic txt-gradient">travel.</span>
          </h2>
          <div className="doodle-divider w-72 mx-auto mt-4" />
          <p className="mt-3 h-hand text-2xl text-inkmist">
            Prices in <span className="text-ink">{region.currency}</span> · region {region.flag} {region.label}
          </p>
        </div>

        <Stepper step={Math.min(step, STEPS.length - 1)} total={STEPS.length} hasPlan={!!plan} />

        <div className="mt-8 diary-page p-6 md:p-10 pl-20 md:pl-24 relative"
             style={{ overflow: "visible" }}>
          <div className="absolute top-4 right-5 h-hand text-2xl text-inkmist/70">
            — page {Math.min(step + 1, STEPS.length)} / {STEPS.length} —
          </div>
          <div className="page-corner" />
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepWrap key="step0">
                <StepHeader title="Where to?" sub="Pick a destination and dates. We start building while you keep going." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Autocomplete
                    label="Destination"
                    value={state.destination}
                    onChange={(v) => { set("destination", v); set("destination_label", v); }}
                    onSelect={(s) => { set("destination", s.raw.name); set("destination_label", s.primary); }}
                    fetcher={cityFetcher}
                    placeholder="Paris, Tokyo, Bali…"
                    minChars={2}
                    prefetchQueries={POPULAR_DESTS}
                    seedSuggestions={seededCitySuggestions}
                    className="md:col-span-3"
                  />
                  <DateField label="Depart" value={state.depart} onChange={(v) => set("depart", v)} />
                  <DateField label="Return" value={state.ret} onChange={(v) => set("ret", v)} />
                  <div className="rounded-xl bg-cream border border-ink/15 px-4 py-2.5 flex flex-col justify-center">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist">Length</div>
                    <div className="mt-0.5 font-medium">{nights} night{nights > 1 ? "s" : ""}</div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="h-hand text-2xl text-inkmist mb-2">scribbled favorites ↓</div>
                  <div className="flex flex-wrap items-center gap-3">
                    {POPULAR_DESTS.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => { set("destination", d); set("destination_label", d); }}
                        className={cn(
                          "sticky-note h-hand text-2xl",
                          i % 3 === 0 && "sticky-pink",
                          i % 3 === 1 && "sticky-blue",
                          i % 3 === 2 && "sticky-green",
                          state.destination === d && "ring-2 ring-ink/40"
                        )}
                      >{d}</button>
                    ))}
                  </div>
                </div>
              </StepWrap>
            )}

            {step === 1 && (
              <StepWrap key="step1">
                <StepHeader title="Who's flying?" sub="Origin airport, travelers, passport for visa logic." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Autocomplete
                    label="From"
                    value={state.origin}
                    onChange={(v) => { set("origin", v.toUpperCase()); set("origin_label", v); }}
                    onSelect={(s) => { set("origin", s.raw.iata); set("origin_label", `${s.raw.iata} · ${s.raw.city}`); }}
                    fetcher={airportFetcher}
                    placeholder="JFK or city name"
                    prefetchQueries={["new", "lon", "par"]}
                    seedSuggestions={seededAirportSuggestions}
                    className="md:col-span-2"
                  />
                  <NumberField label="Travelers" value={state.pax} onChange={(n) => set("pax", n)} min={1} max={12} />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-cream border border-ink/15 px-4 py-2.5">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist">Passport</div>
                    <div className="mt-0.5 font-medium">{region.flag} {region.nationality}</div>
                    <div className="text-xs text-inkmist">Auto-selected from region · change in nav.</div>
                  </div>
                  <Toggle label="Nonstop only" v={state.prefs.nonstop_only} onChange={(b) => setPref("nonstop_only", b)} />
                  <Toggle label="Accessible travel" v={state.prefs.accessible} onChange={(b) => setPref("accessible", b)} />
                </div>
              </StepWrap>
            )}

            {step === 2 && (
              <StepWrap key="step2">
                <StepHeader title="Your style" sub="We weight attractions, hotels, and pacing around this." />

                <Section icon={<Wallet className="h-4 w-4" />} title="Budget">
                  <ChipRow
                    items={[
                      { id: "low", label: "Backpacker" },
                      { id: "mid", label: "Mid-range" },
                      { id: "high", label: "Premium" },
                      { id: "luxury", label: "Luxury" },
                    ]}
                    active={state.prefs.budget}
                    onPick={(v) => setPref("budget", v as any)}
                  />
                </Section>

                <Section icon={<Heart className="h-4 w-4" />} title="Vibe">
                  <ChipRow
                    multi
                    items={VIBES.map((v) => ({ id: v.id, label: `${v.emoji} ${v.label}` }))}
                    activeSet={state.prefs.vibe}
                    onPick={(v) => toggleArr("vibe", v)}
                  />
                </Section>

                <Section icon={<Gauge className="h-4 w-4" />} title="Pace">
                  <ChipRow
                    items={[
                      { id: "chill", label: "Chill (2/day)" },
                      { id: "balanced", label: "Balanced (3/day)" },
                      { id: "packed", label: "Packed (5/day)" },
                    ]}
                    active={state.prefs.pace}
                    onPick={(v) => setPref("pace", v as any)}
                  />
                </Section>

                <Section icon={<Sparkles className="h-4 w-4" />} title="Interests">
                  <ChipRow
                    multi
                    items={INTERESTS.map((i) => ({ id: i, label: i }))}
                    activeSet={state.prefs.interests}
                    onPick={(v) => toggleArr("interests", v)}
                  />
                </Section>

                <Section title="Sort">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <SelectField
                      label="Flights"
                      value={state.prefs.sort_flights_by}
                      options={[
                        { v: "best", l: "Best (balance)" },
                        { v: "cheapest", l: "Cheapest" },
                        { v: "fastest", l: "Fastest" },
                      ]}
                      onChange={(v) => setPref("sort_flights_by", v as any)}
                    />
                    <SelectField
                      label="Hotels"
                      value={state.prefs.sort_hotels_by}
                      options={[
                        { v: "best", l: "Best value" },
                        { v: "cheapest", l: "Cheapest" },
                        { v: "top_rated", l: "Top rated" },
                      ]}
                      onChange={(v) => setPref("sort_hotels_by", v as any)}
                    />
                  </div>
                </Section>
              </StepWrap>
            )}

            {step === 3 && (
              <StepWrap key="step3">
                <StepHeader title="Review" sub="One search builds flights, hotels, attractions, weather, and visa together." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Summary
                    title="Trip"
                    rows={[
                      ["Destination", `${state.destination_label}`],
                      ["From", state.origin_label],
                      ["Depart", state.depart],
                      ["Return", state.ret],
                      ["Length", `${nights} night${nights > 1 ? "s" : ""}`],
                      ["Travelers", String(state.pax)],
                      ["Passport", `${region.flag} ${region.nationality}`],
                      ["Currency", region.currency],
                    ]}
                  />
                  <Summary
                    title="Preferences"
                    rows={[
                      ["Budget", state.prefs.budget],
                      ["Vibe", state.prefs.vibe.join(", ") || "—"],
                      ["Pace", state.prefs.pace],
                      ["Interests", state.prefs.interests.join(", ") || "—"],
                      ["Nonstop only", state.prefs.nonstop_only ? "Yes" : "No"],
                      ["Sort flights", state.prefs.sort_flights_by],
                      ["Sort hotels", state.prefs.sort_hotels_by],
                    ]}
                  />
                </div>
              </StepWrap>
            )}
          </AnimatePresence>

          {!plan && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || loading}
                className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 hover:bg-paper disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  disabled={!canNext}
                  className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 font-medium hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 transition"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={loading}
                  className="group relative overflow-hidden inline-flex items-center gap-2 rounded-full bg-ink text-cream px-7 py-3 font-medium hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition"
                >
                  <span className="relative z-10 inline-flex items-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {loading ? "Building your trip…" : "Plan my trip"}
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-coral via-sun to-sage opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition duration-500" />
                </button>
              )}
            </div>
          )}

          {err && <div className="mt-4 text-sm text-coral">⚠ {err}</div>}
        </div>

        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 space-y-8"
            >
              <ResultsHeader plan={plan} format={format} onEdit={() => setStep(0)} />
              <div className="flex gap-2 flex-wrap">
                {(["itinerary", "flights", "hotels", "attractions"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-full px-5 py-2 text-sm capitalize transition",
                      tab === t ? "bg-ink text-cream" : "glass hover:bg-paper"
                    )}
                  >
                    {t}{t !== "itinerary" ? ` (${(plan as any)[t]?.length ?? 0})` : (plan.itinerary?.length ? ` (${plan.itinerary.length} days)` : "")}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab === "itinerary" && <Itinerary plan={plan} format={format} />}
                  {tab === "flights" && <FlightsList plan={plan} format={format} />}
                  {tab === "hotels" && <HotelsList plan={plan} format={format} />}
                  {tab === "attractions" && <AttractionsList plan={plan} />}
                </motion.div>
              </AnimatePresence>
              <TopStrip plan={plan} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});
TripWizard.displayName = "TripWizard";
export default TripWizard;

/* ============================ subcomponents ============================ */

function Stepper({ step, total, hasPlan }: { step: number; total: number; hasPlan: boolean }) {
  return (
    <div className="mx-auto max-w-3xl flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = hasPlan || i < step;
        const active = !hasPlan && i === step;
        return (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={cn(
              "h-7 w-7 rounded-full text-xs flex items-center justify-center ring-1 transition shrink-0",
              done ? "bg-sage text-cream ring-sage" :
              active ? "bg-ink text-cream ring-ink" :
              "bg-cream text-inkmist ring-ink/20"
            )}>
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className={cn("hidden sm:block text-xs uppercase tracking-widest", active ? "text-ink" : "text-inkmist")}>{s}</div>
            {i < total - 1 && (
              <div className={cn("flex-1 h-px transition", done ? "bg-sage/60" : "bg-ink/10")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-7">
      <h3 className="h-display text-3xl sm:text-4xl text-ink underline-doodle">{title}</h3>
      <p className="mt-3 h-hand text-2xl text-inkmist">{sub}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-6 first:mt-0">
      <div className="h-hand text-2xl text-ink mb-2 flex items-center gap-2">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

type ChipItem = { id: string; label: string };
function ChipRow({
  items, active, activeSet, onPick, multi,
}: {
  items: ChipItem[]; active?: string; activeSet?: string[]; multi?: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const isActive = multi ? activeSet?.includes(it.id) : active === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onPick(it.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition border-2",
              isActive
                ? "bg-ink text-cream border-ink shadow-[2px_2px_0_rgba(29,24,20,0.6)]"
                : "border-ink/30 bg-cream text-ink hover:bg-paper hover:border-ink"
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="rounded-xl bg-cream border border-ink/15 px-4 py-2.5 block focus-within:ring-ink/30 transition">
      <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {label}</div>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full bg-transparent outline-none text-ink [color-scheme:light]" />
    </label>
  );
}

function NumberField({ label, value, onChange, min = 1, max = 10 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="rounded-xl bg-cream border border-ink/15 px-4 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist flex items-center gap-1.5"><Users className="h-3 w-3" /> {label}</div>
      <div className="mt-1 flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="h-7 w-7 rounded-full bg-paper hover:bg-paper transition">−</button>
        <span className="font-medium tabular-nums w-6 text-center">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="h-7 w-7 rounded-full bg-paper hover:bg-paper transition">+</button>
      </div>
    </div>
  );
}

function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (b: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!v)}
      className="rounded-xl bg-cream border border-ink/15 px-4 py-2.5 text-left transition hover:bg-paper"
    >
      <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-medium">{v ? "On" : "Off"}</span>
        <span className={cn("h-5 w-9 rounded-full transition relative", v ? "bg-sage" : "bg-paper")}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all", v ? "left-[18px]" : "left-0.5")} />
        </span>
      </div>
    </button>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="rounded-xl bg-cream border border-ink/15 px-4 py-2.5 block">
      <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full bg-transparent outline-none text-ink appearance-none cursor-pointer">
        {options.map((o) => <option key={o.v} value={o.v} className="bg-cream text-ink">{o.l}</option>)}
      </select>
    </label>
  );
}

function Summary({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl bg-cream border border-ink/15 p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-inkmist mb-3">{title}</div>
      <dl className="grid grid-cols-1 gap-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className="text-inkmist">{k}</dt>
            <dd className="text-ink text-right truncate">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ResultsHeader({ plan, format, onEdit }: { plan: TripPlan; format: (n: number) => string; onEdit: () => void }) {
  return (
    <div className="ticket-stub flex flex-wrap items-center justify-between gap-4 relative">
      <div>
        <div className="h-hand text-2xl text-coral">trip total ~</div>
        <div className="h-display text-4xl text-ink">
          {plan.estimated_total_usd ? format(plan.estimated_total_usd) : "—"}
        </div>
        <div className="text-xs text-inkmist mt-1 italic">
          Cheapest flight + hotel × nights · meals & tickets not included.
        </div>
      </div>
      <button onClick={onEdit} className="rounded-full border-2 border-ink/30 hover:border-ink bg-cream px-5 py-2 text-sm font-medium text-ink transition">
        ✎ Edit trip
      </button>
    </div>
  );
}

function Itinerary({ plan, format }: { plan: TripPlan; format: (n: number) => string }) {
  const [openDay, setOpenDay] = useState<number | null>(1);
  if (!plan.itinerary || plan.itinerary.length === 0) {
    return <div className="text-inkmist">No itinerary yet — set valid dates and try again.</div>;
  }
  return (
    <div className="grid gap-4">
      {plan.itinerary.map((d, i) => {
        const open = openDay === d.day;
        return (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-3xl overflow-hidden ring-1 ring-ink/15"
          >
            <button
              onClick={() => setOpenDay(open ? null : d.day)}
              className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4 hover:bg-paper transition"
            >
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.3em] text-inkmist">Day {d.day} · {d.date}</div>
                <div className="h-display text-2xl mt-1 truncate">{d.summary}</div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex -space-x-2">
                  {d.items.filter((x) => x.image && x.kind !== "transit").slice(0, 4).map((it, k) => (
                    <img key={k} src={it.image} alt=""
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-cream border border-ink/15" />
                  ))}
                </div>
                <div className="text-right">
                  <div className="text-xs text-inkmist">
                    {d.items.filter((x) => x.kind !== "transit").length} stops
                  </div>
                  <ChevronRight className={cn("h-4 w-4 text-inkmist transition", open && "rotate-90")} />
                </div>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 md:px-6 pb-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {d.items.filter((x) => x.kind !== "transit").map((it, j) => (
                        <ItineraryCard key={j} it={it} />
                      ))}
                    </div>
                    <DayTimeline items={d.items} format={format} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function DayTimeline({ items, format }: { items: ItineraryDayItem[]; format: (n: number) => string }) {
  return (
    <div className="mt-6 rounded-2xl bg-cream/60 ring-1 ring-ink/10 p-4 md:p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-inkmist mb-3">Day route</div>
      <ol className="relative border-l border-ink/15 ml-2 space-y-3 pl-5">
        {items.map((it, j) => (
          <li key={j} className="relative">
            <span className={cn(
              "absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-cream",
              it.kind === "attraction" && "bg-coral",
              it.kind === "meal" && "bg-sage",
              it.kind === "transit" && "bg-sky",
              it.kind === "rest" && "bg-sun",
              it.kind === "hotel" && "bg-plum",
            )} />
            <div className="flex items-baseline gap-3 flex-wrap text-sm">
              <span className="font-mono text-xs text-inkmist w-12 shrink-0">{it.time}</span>
              {it.kind === "transit" ? (
                <TransitPill it={it} format={format} />
              ) : (
                <>
                  <span className="font-medium">{it.title}</span>
                  {it.duration_min ? (
                    <span className="text-xs text-inkmist">
                      · {Math.round(it.duration_min / 60 * 10) / 10}h
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TransitPill({ it, format }: { it: ItineraryDayItem; format: (n: number) => string }) {
  const km = it.transit_distance_km;
  const mins = it.duration_min;
  const cost = it.transit_cost_usd;
  const mode = it.transit_mode as any;
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-cream border border-ink/15 pl-1 pr-3 py-1 text-xs text-ink shadow-sm">
      {mode ? <TransportIcon mode={mode} size={28} /> : <span className="text-base leading-none">{it.title.split(" ")[0]}</span>}
      <span className="capitalize font-medium">{it.transit_mode || "transit"}</span>
      {km ? <span className="text-inkmist">· {km} km</span> : null}
      {mins ? <span className="text-inkmist">· {mins} min</span> : null}
      {cost && cost > 0 ? <span className="text-inkmist">· {format(cost)}</span> : null}
    </span>
  );
}

function ItineraryCard({ it }: { it: ItineraryDayItem }) {
  const kindColor: Record<string, string> = {
    attraction: "bg-coral", meal: "bg-sage", transit: "bg-sky",
    rest: "bg-sun", hotel: "bg-plum",
  };
  const mapHref = it.lat && it.lng
    ? `https://www.google.com/maps/search/?api=1&query=${it.lat},${it.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.title)}`;
  return (
    <motion.a
      href={mapHref} target="_blank" rel="noreferrer"
      whileHover={{ y: -6, rotate: 0, scale: 1.02 }}
      className="relative polaroid polaroid-tape group block"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-paper rounded-sm">
        {it.image ? (
          <img src={it.image} alt={it.title}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-700" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-3xl text-ink/30">
            {it.kind === "transit" ? "✈" : it.kind === "rest" ? "☕" : "◷"}
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <span className={cn("inline-block h-2 w-2 rounded-full ring-1 ring-cream", kindColor[it.kind] || "bg-ink")} />
          <span className="text-[10px] uppercase tracking-[0.25em] text-ink rounded-full bg-cream/95 border border-ink/15 px-2 py-0.5">
            {it.time}
          </span>
        </div>
        {it.rating && (
          <div className="absolute top-2 right-2 rounded-full bg-cream/95 border border-ink/15 px-2 py-0.5 text-[11px] flex items-center gap-1 text-ink">
            <Star className="h-3 w-3 fill-current text-coral" /> {it.rating}
          </div>
        )}
        {it.duration_min ? (
          <div className="absolute bottom-2 left-2 rounded-full bg-cream/95 border border-ink/15 px-2 py-0.5 text-[11px] text-ink">
            {Math.round(it.duration_min / 60 * 10) / 10}h
          </div>
        ) : null}
      </div>
      <div className="px-1 pt-3">
        <div className="h-hand text-2xl leading-tight text-ink line-clamp-2">{it.title}</div>
        {it.category && <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist mt-0.5">{it.category}</div>}
        {it.note && <div className="text-xs text-inkmist mt-1.5 line-clamp-2">{it.note}</div>}
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-coral opacity-0 group-hover:opacity-100 transition">
          <MapPin className="h-3 w-3" /> Open in Maps
        </div>
      </div>
    </motion.a>
  );
}

function TopStrip({ plan }: { plan: TripPlan }) {
  const w = plan.weather; const v = plan.visa;
  if (!w && !v) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {w && (
        <div className="glass rounded-2xl p-6 flex items-start gap-5">
          <div className="text-5xl shrink-0">{w.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.3em] text-inkmist mb-1 flex items-center gap-2"><Sun className="h-3.5 w-3.5" /> Weather · {w.city}</div>
            <div className="text-2xl md:text-3xl h-display">{Math.round(w.temp_c)}°C · {w.condition}</div>
            <div className="text-sm text-inkmist mt-1">{w.humidity ?? "—"}% humidity · {w.wind_kph ?? "—"} kph wind</div>
            {w.forecast.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {w.forecast.slice(0, 7).map((d, i) => (
                  <div key={i} className="rounded-lg bg-paper px-2.5 py-1.5 text-xs">
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
          <div className="text-xs uppercase tracking-[0.3em] text-inkmist mb-1 flex items-center gap-2"><Stamp className="h-3.5 w-3.5" /> Visa · {v.nationality} → {v.destination}</div>
          <div className="text-2xl h-display">{v.required ? "Visa required" : "No visa needed"}</div>
          <div className="mt-1 text-sm text-ink">{v.type}{v.duration_days ? ` · up to ${v.duration_days} days` : ""}</div>
          {v.notes && <div className="mt-3 text-sm text-inkmist">{v.notes}</div>}
        </div>
      )}
    </div>
  );
}

function FlightsList({ plan, format }: { plan: TripPlan; format: (n: number) => string }) {
  if (!plan.flights.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Plane className="h-8 w-8 text-inkmist mx-auto mb-3" />
        <div className="h-display text-2xl mb-2">No flights for this route</div>
        <div className="text-sm text-inkmist max-w-md mx-auto">
          We couldn't find direct flight data for this origin/destination pair.
          Try a major hub (e.g. JFK, LHR, DEL) or a different destination.
        </div>
      </div>
    );
  }
  const allSample = plan.flights.every((f) => f.is_sample);
  return (
    <div className="grid gap-3">
      {allSample && (
        <div className="rounded-2xl border border-sun/50 bg-sun/15 px-4 py-3 text-xs text-ink">
          Showing estimated fares while live flight data is being configured.
          Tap "Open in Google Flights" for current bookings.
        </div>
      )}
      {plan.flights.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
          className="ticket-stub flex items-center gap-4 sm:gap-6 hover:shadow-md transition group"
        >
          {f.airline_logo ? (
            <img src={f.airline_logo} alt={f.airline} className="h-8 w-8 rounded-lg bg-white object-contain shrink-0" />
          ) : (
            <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-coral shrink-0" />
          )}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 items-center min-w-0">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-inkmist">Airline</div>
              <div className="font-medium truncate">{f.airline}</div>
              <div className="text-xs text-inkmist">
                {f.flight_no || (f.is_sample ? "estimate" : "")}
                {f.cabin ? ` · ${f.cabin}` : ""}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-inkmist">Route</div>
              <div className="font-medium truncate">{f.origin} → {f.destination}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-inkmist">Times</div>
              <div className="font-medium truncate">{f.depart_time} – {f.arrive_time}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-inkmist">{f.duration}</div>
              <div className="font-medium truncate">{f.stops === 0 ? "Nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-inkmist">{f.is_sample ? "From" : "Price"}</div>
              <div className="h-display text-xl sm:text-2xl whitespace-nowrap">{format(f.price_usd)}</div>
            </div>
          </div>
          {f.deep_link && (
            <a href={f.deep_link} target="_blank" rel="noreferrer"
              className="opacity-60 group-hover:opacity-100 transition shrink-0"
              title="Open in Google Flights">
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
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
              <div className="rounded-full bg-cream/95 border border-ink/15 px-3 py-1 text-xs whitespace-nowrap text-ink">{format(h.price_usd)} / night</div>
              {h.rating && <div className="rounded-full bg-cream/95 border border-ink/15 px-3 py-1 text-xs flex items-center gap-1 whitespace-nowrap text-ink"><Star className="h-3 w-3 fill-current text-coral" /> {h.rating}</div>}
            </div>
          </div>
          <div className="p-5">
            <div className="h-display text-xl mb-1 line-clamp-2">{h.name}</div>
            {h.address && <div className="text-xs text-inkmist flex items-center gap-1 mb-2 truncate"><MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{h.address}</span></div>}
            <div className="flex gap-1.5 flex-wrap mt-3">
              {h.amenities.slice(0, 4).map((a, j) => (
                <span key={j} className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] text-inkmist">{a}</span>
              ))}
            </div>
            {h.deep_link && <a href={h.deep_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-coral hover:underline">Book <ExternalLink className="h-3.5 w-3.5" /></a>}
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
          className="glass rounded-2xl overflow-hidden hover:ring-1 hover:ring-ink/30 transition"
        >
          <div className="aspect-square overflow-hidden">
            {a.image && <img src={a.image} alt={a.name} className="h-full w-full object-cover hover:scale-110 transition duration-700" />}
          </div>
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-inkmist">{a.category}</div>
            <div className="h-display text-lg mt-1 line-clamp-2">{a.name}</div>
            {a.rating && <div className="text-xs text-inkmist mt-1">★ {a.rating} · {a.reviews?.toLocaleString()} reviews</div>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
