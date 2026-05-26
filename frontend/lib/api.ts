export type Flight = {
  airline: string; flight_no?: string; depart_time: string; arrive_time: string;
  duration: string; stops: number; price_usd: number; deep_link?: string;
  origin: string; destination: string;
  airline_logo?: string; cabin?: string; is_sample?: boolean;
};
export type Hotel = {
  name: string; rating?: number; reviews?: number; price_usd: number;
  image?: string; address?: string; deep_link?: string; amenities: string[];
};
export type Attraction = {
  name: string; rating?: number; reviews?: number; category?: string;
  image?: string; description?: string; lat?: number; lng?: number;
};
export type Weather = {
  city: string; date?: string; temp_c: number; temp_min_c?: number; temp_max_c?: number;
  condition: string; humidity?: number; wind_kph?: number; icon?: string;
  forecast: { date: string; condition: string; icon: string; max_c: number; min_c: number }[];
};
export type Visa = {
  nationality: string; destination: string; required: boolean; type: string;
  duration_days?: number; notes?: string;
};
export type Preferences = {
  budget?: "low" | "mid" | "high" | "luxury";
  vibe?: string[];
  pace?: "chill" | "balanced" | "packed";
  interests?: string[];
  nonstop_only?: boolean;
  max_stops?: number;
  accessible?: boolean;
  sort_flights_by?: "best" | "cheapest" | "fastest";
  sort_hotels_by?: "best" | "cheapest" | "top_rated";
};
export type ItineraryDayItem = {
  time: string; title: string; kind: string; note?: string;
  image?: string; category?: string; rating?: number;
  lat?: number; lng?: number; duration_min?: number;
  transit_mode?: "walk" | "metro" | "taxi" | "drive" | "train" | "flight";
  transit_distance_km?: number;
  transit_cost_usd?: number;
  from_lat?: number;
  from_lng?: number;
};
export type ItineraryDay = {
  day: number; date?: string; summary: string;
  items: ItineraryDayItem[]; hotel?: Hotel | null;
};

export type TripPlan = {
  flights: Flight[]; hotels: Hotel[]; attractions: Attraction[];
  weather?: Weather | null; visa?: Visa | null;
  itinerary?: ItineraryDay[];
  preferences?: Preferences;
  estimated_total_usd?: number | null;
};

const base = "";

async function j<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const ctrl = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 15000;
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(base + path, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

function jq<T>(path: string, timeoutMs: number): Promise<T> {
  return j<T>(path, { timeoutMs });
}

export type AirportSuggestion = {
  iata: string; city: string; name: string; country: string;
};
export type CitySuggestion = {
  name: string; country?: string; admin1?: string; lat?: number; lng?: number; population?: number;
};
export type FxData = { base: string; rates: Record<string, number> };

export const api = {
  flights: (q: { origin: string; destination: string; depart: string; ret?: string; pax?: number }) => {
    const p = new URLSearchParams({ origin: q.origin, destination: q.destination, depart: q.depart, pax: String(q.pax ?? 1) });
    if (q.ret) p.set("ret", q.ret);
    return j<Flight[]>(`/api/flights?${p}`);
  },
  hotels: (q: { city: string; checkin: string; checkout: string; guests?: number }) => {
    const p = new URLSearchParams({ city: q.city, checkin: q.checkin, checkout: q.checkout, guests: String(q.guests ?? 2) });
    return j<Hotel[]>(`/api/hotels?${p}`);
  },
  attractions: (q: { city: string; limit?: number }) => {
    const p = new URLSearchParams({ city: q.city, limit: String(q.limit ?? 12) });
    return j<Attraction[]>(`/api/attractions?${p}`);
  },
  weather: (q: { city: string; date?: string }) => {
    const p = new URLSearchParams({ city: q.city });
    if (q.date) p.set("date", q.date);
    return j<Weather>(`/api/weather?${p}`);
  },
  visa: (q: { nationality: string; destination: string }) =>
    j<Visa>(`/api/visa?nationality=${q.nationality}&destination=${encodeURIComponent(q.destination)}`),
  plan: (q: { origin?: string; destination: string; depart?: string; ret?: string; pax?: number; nationality?: string; preferences?: Preferences }) =>
    j<TripPlan>("/api/plan", { method: "POST", body: JSON.stringify(q), timeoutMs: 60000 }),
  suggestAirports: (q: string) => jq<AirportSuggestion[]>(`/api/suggest/airports?q=${encodeURIComponent(q)}`, 5000),
  suggestCities: (q: string) => jq<CitySuggestion[]>(`/api/suggest/cities?q=${encodeURIComponent(q)}`, 6000),
  fx: () => jq<FxData>("/api/fx", 8000),
};
