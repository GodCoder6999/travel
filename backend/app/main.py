from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from cachetools import TTLCache
from typing import Optional
import asyncio

from .scrapers.flights import scrape_flights
from .scrapers.hotels import scrape_hotels
from .scrapers.attractions import scrape_attractions
from .scrapers.weather_visa import get_weather, get_visa
from .scrapers.suggest import (
    suggest_airports, suggest_cities, resolve_city_to_iata,
    kick_off_load as _kick_airports,
)
from .scrapers.fx import get_rates
from datetime import date
from .models import (
    FlightResult, HotelResult, AttractionResult,
    TripPlan, WeatherInfo, VisaInfo, Preferences,
)
from .itinerary import (
    filter_attractions, filter_flights, filter_hotels,
    build_itinerary, estimate_total,
)

app = FastAPI(title="Voyage API", version="1.0.0")


@app.on_event("startup")
async def _preload():
    _kick_airports()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cache = TTLCache(maxsize=512, ttl=600)


def _ck(*parts) -> str:
    return "|".join(str(p) for p in parts)


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/api/suggest/airports")
async def api_suggest_airports(q: str = Query(..., min_length=1), limit: int = 12):
    return await suggest_airports(q, limit)


@app.get("/api/suggest/cities")
async def api_suggest_cities(q: str = Query(..., min_length=2), limit: int = 12):
    return await suggest_cities(q, limit)


@app.get("/api/fx")
async def api_fx():
    rates = await get_rates()
    return {"base": "USD", "rates": rates}


@app.get("/api/flights", response_model=list[FlightResult])
async def flights(
    origin: str = Query(..., min_length=2),
    destination: str = Query(..., min_length=2),
    depart: str = Query(...),
    ret: Optional[str] = None,
    pax: int = 1,
):
    o = resolve_city_to_iata(origin)
    d = resolve_city_to_iata(destination)
    if not o or not d:
        raise HTTPException(status_code=400, detail="Could not resolve origin or destination to an airport.")
    key = _ck("fl", o, d, depart, ret, pax)
    if key in cache:
        return cache[key]
    try:
        data = await scrape_flights(o, d, depart, ret, pax)
        cache[key] = data
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"flights lookup failed: {e}")


@app.get("/api/hotels", response_model=list[HotelResult])
async def hotels(
    city: str = Query(..., min_length=2),
    checkin: str = Query(...),
    checkout: str = Query(...),
    guests: int = 2,
):
    key = _ck("ho", city, checkin, checkout, guests)
    if key in cache:
        return cache[key]
    try:
        data = await scrape_hotels(city, checkin, checkout, guests)
        cache[key] = data
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"hotels scrape failed: {e}")


@app.get("/api/attractions", response_model=list[AttractionResult])
async def attractions(city: str = Query(..., min_length=2), limit: int = 20):
    key = _ck("at", city, limit)
    if key in cache:
        return cache[key]
    try:
        data = await scrape_attractions(city, limit)
        cache[key] = data
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"attractions scrape failed: {e}")


@app.get("/api/weather", response_model=WeatherInfo)
async def weather(city: str, date: Optional[str] = None):
    key = _ck("we", city, date)
    if key in cache:
        return cache[key]
    data = await get_weather(city, date)
    cache[key] = data
    return data


@app.get("/api/visa", response_model=VisaInfo)
async def visa(nationality: str, destination: str):
    key = _ck("vi", nationality, destination)
    if key in cache:
        return cache[key]
    data = await get_visa(nationality, destination)
    cache[key] = data
    return data


@app.post("/api/plan", response_model=TripPlan)
async def plan(query: dict):
    import traceback, sys
    try:
        return await _plan_impl(query)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=502, detail=f"plan failed: {type(e).__name__}: {e}")


async def _plan_impl(query: dict) -> TripPlan:
    origin = query.get("origin")
    dest = query.get("destination")
    depart = query.get("depart")
    ret = query.get("ret")
    pax = int(query.get("pax", 2))
    nationality = query.get("nationality", "US")
    prefs_raw = query.get("preferences") or {}
    prefs = Preferences(**prefs_raw)

    # Resolve city names to IATA airport codes. Flights API needs 3-letter codes.
    origin_iata = resolve_city_to_iata(origin) if origin else None
    dest_iata = resolve_city_to_iata(dest) if dest else None

    f_task = (
        scrape_flights(origin_iata, dest_iata, depart, ret, pax)
        if origin_iata and dest_iata and depart else asyncio.sleep(0, result=[])
    )
    h_task = scrape_hotels(dest, depart, ret or depart, pax) if dest and depart else asyncio.sleep(0, result=[])
    a_task = scrape_attractions(dest, 32) if dest else asyncio.sleep(0, result=[])
    w_task = get_weather(dest, depart) if dest else asyncio.sleep(0, result=None)
    v_task = get_visa(nationality, dest) if dest else asyncio.sleep(0, result=None)

    flights_r, hotels_r, attr_r, weather_r, visa_r = await asyncio.gather(
        f_task, h_task, a_task, w_task, v_task, return_exceptions=True
    )

    def _ok(x, default):
        return default if isinstance(x, Exception) else x

    flights = filter_flights(_ok(flights_r, []), prefs)
    hotels = filter_hotels(_ok(hotels_r, []), prefs)
    attractions = filter_attractions(_ok(attr_r, []), prefs, top=24)

    try:
        nights = (date.fromisoformat(ret) - date.fromisoformat(depart)).days if depart and ret else 3
    except Exception:
        nights = 3
    nights = max(1, nights)

    itinerary = build_itinerary(depart, ret, attractions, prefs, hotels=hotels)
    total = estimate_total(flights, hotels, nights)

    return TripPlan(
        flights=flights, hotels=hotels, attractions=attractions,
        weather=_ok(weather_r, None), visa=_ok(visa_r, None),
        itinerary=itinerary, preferences=prefs, estimated_total_usd=total,
    )
