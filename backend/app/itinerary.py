"""
Build a day-by-day itinerary from scraped attractions + prefs.
Pure deterministic — no LLM required.
"""
from datetime import date, timedelta
from typing import Optional
from .models import (
    AttractionResult, HotelResult, ItineraryDay, ItineraryDayItem, Preferences,
)
from .transit import build_segment, order_by_proximity


def _add_minutes(hhmm: str, minutes: int) -> str:
    try:
        h, m = hhmm.split(":")
        total = int(h) * 60 + int(m) + minutes
        total %= 24 * 60
        return f"{total // 60:02d}:{total % 60:02d}"
    except Exception:
        return hhmm


INTEREST_TO_CAT: dict[str, set[str]] = {
    "museums": {"museum", "gallery", "art"},
    "art": {"gallery", "artwork", "art"},
    "history": {"historic", "monument", "ruins", "castle", "cathedral", "old town", "memorial"},
    "parks": {"park", "garden", "viewpoint"},
    "nature": {"park", "garden", "viewpoint", "zoo"},
    "beaches": {"beach"},
    "hiking": {"viewpoint", "park"},
    "shopping": {"market", "plaza"},
    "food": {"market"},
    "nightlife": {"plaza"},
    "family": {"zoo", "theme park", "park", "museum"},
}

VIBE_BIAS: dict[str, set[str]] = {
    "relax": {"park", "garden", "viewpoint", "beach"},
    "adventure": {"viewpoint", "park", "theme park"},
    "culture": {"museum", "gallery", "historic", "monument", "cathedral", "old town"},
    "foodie": {"market", "plaza"},
    "nightlife": {"plaza", "market"},
    "family": {"zoo", "theme park", "park", "museum"},
    "romance": {"viewpoint", "garden", "old town"},
}

PACE_PER_DAY = {"chill": 2, "balanced": 3, "packed": 5}


def _score_attraction(a: AttractionResult, prefs: Preferences) -> float:
    cat = (a.category or "").lower()
    score = (a.rating or 3.8) * 10
    bias: set[str] = set()
    for i in prefs.interests:
        bias |= INTEREST_TO_CAT.get(i.lower(), set())
    for v in prefs.vibe:
        bias |= VIBE_BIAS.get(v.lower(), set())
    if bias and any(b in cat for b in bias):
        score += 25
    if (a.reviews or 0) > 1000:
        score += 5
    return score


def filter_attractions(attractions: list[AttractionResult], prefs: Preferences, top: int = 24) -> list[AttractionResult]:
    if not attractions:
        return []
    ranked = sorted(attractions, key=lambda a: -_score_attraction(a, prefs))
    return ranked[:top]


def filter_flights(flights, prefs: Preferences):
    out = [f for f in flights if f.stops <= prefs.max_stops]
    if prefs.nonstop_only:
        out = [f for f in out if f.stops == 0] or out  # don't blank entirely
    if prefs.sort_flights_by == "cheapest":
        out.sort(key=lambda f: f.price_usd)
    elif prefs.sort_flights_by == "fastest":
        out.sort(key=lambda f: _duration_to_min(f.duration))
    else:  # best: balance of price+stops+duration
        out.sort(key=lambda f: f.price_usd + f.stops * 60 + _duration_to_min(f.duration) * 0.5)
    return out


def filter_hotels(hotels, prefs: Preferences):
    out = list(hotels)
    cap = {"low": 90, "mid": 220, "high": 420, "luxury": 10000}.get(prefs.budget, 220)
    floor = {"low": 0, "mid": 70, "high": 180, "luxury": 350}.get(prefs.budget, 0)
    filtered = [h for h in out if floor <= h.price_usd <= cap]
    out = filtered or out
    if prefs.sort_hotels_by == "cheapest":
        out.sort(key=lambda h: h.price_usd)
    elif prefs.sort_hotels_by == "top_rated":
        out.sort(key=lambda h: -(h.rating or 0))
    else:
        out.sort(key=lambda h: (-(h.rating or 0) * 30 + h.price_usd * 0.5))
    return out


def _duration_to_min(s: str) -> int:
    h = m = 0
    for tok in (s or "").replace("hr", "h").split():
        if tok.endswith("h"):
            try: h = int(tok[:-1])
            except: pass
        if tok.endswith("m"):
            try: m = int(tok[:-3 if tok.endswith("min") else -1])
            except: pass
    return h * 60 + m


DURATION_BY_KIND = {
    "attraction": 90, "meal": 75, "transit": 60, "rest": 0, "hotel": 0,
}


def _kind_for(cat: Optional[str]) -> str:
    c = (cat or "").lower()
    if c in ("market",): return "meal"
    return "attraction"


def build_itinerary(
    depart: Optional[str], ret: Optional[str],
    attractions: list[AttractionResult], prefs: Preferences,
    hotels: Optional[list[HotelResult]] = None,
) -> list[ItineraryDay]:
    if not depart:
        return []
    try:
        d0 = date.fromisoformat(depart)
    except Exception:
        return []
    try:
        d1 = date.fromisoformat(ret) if ret else d0 + timedelta(days=3)
    except Exception:
        d1 = d0 + timedelta(days=3)
    nights = max(1, (d1 - d0).days)
    days = nights + 1
    per_day = PACE_PER_DAY.get(prefs.pace, 3)

    ranked = filter_attractions(attractions, prefs, top=days * per_day + 4)
    picked_hotel = hotels[0] if hotels else None

    hotel_pt = (picked_hotel.lat, picked_hotel.lng) if picked_hotel else (None, None)

    out: list[ItineraryDay] = []
    idx = 0
    for d in range(days):
        cur_date = d0 + timedelta(days=d)
        items: list[ItineraryDayItem] = []

        # Build raw attractions for this day, then proximity-sort.
        raw_attrs = ranked[idx: idx + per_day]
        idx += per_day
        raw_items: list[ItineraryDayItem] = []
        for a in raw_attrs:
            kind = _kind_for(a.category)
            raw_items.append(ItineraryDayItem(
                time="—", title=a.name, kind=kind,
                note=a.description or f"{a.category or 'Point of interest'}",
                category=a.category, rating=a.rating,
                lat=a.lat, lng=a.lng, image=a.image,
                duration_min=DURATION_BY_KIND.get(kind, 75),
            ))
        ordered = order_by_proximity(hotel_pt, raw_items) if hotel_pt[0] is not None else raw_items

        # Arrival day: check-in first.
        if d == 0:
            items.append(ItineraryDayItem(
                time="14:00",
                title=f"Check-in · {picked_hotel.name}" if picked_hotel else "Arrival + check-in",
                kind="hotel" if picked_hotel else "transit",
                note=picked_hotel.address if picked_hotel else "Drop bags, light walk near the hotel.",
                image=picked_hotel.image if picked_hotel else None,
                rating=picked_hotel.rating if picked_hotel else None,
                lat=picked_hotel.lat if picked_hotel else None,
                lng=picked_hotel.lng if picked_hotel else None,
                category="Hotel" if picked_hotel else None,
                duration_min=60,
            ))
            clock = "15:30"
            prev_pt = hotel_pt
        else:
            clock = "09:00"
            prev_pt = hotel_pt  # day starts from hotel

        # Insert transit + attraction pairs, advancing clock realistically.
        for stop in ordered:
            stop_pt = (stop.lat, stop.lng)
            seg = build_segment(prev_pt, stop_pt, target_time=clock)
            if seg:
                seg.time = clock
                clock = _add_minutes(clock, seg.duration_min or 15)
                items.append(seg)
            stop.time = clock
            items.append(stop)
            clock = _add_minutes(clock, stop.duration_min or 75)
            if stop.lat is not None and stop.lng is not None:
                prev_pt = stop_pt

        # Return to hotel at end of day if we wandered.
        if d < days - 1 and ordered and hotel_pt[0] is not None and prev_pt != hotel_pt:
            back = build_segment(prev_pt, hotel_pt, target_time=clock)
            if back:
                back.title = back.title.replace("Walk", "Walk back").replace("Metro", "Metro back")
                back.title = back.title if "back" in back.title else f"{back.title} → hotel"
                items.append(back)

        # Departure day: checkout + airport transfer.
        if d == days - 1:
            items.append(ItineraryDayItem(
                time="11:00",
                title="Checkout · transfer to airport",
                kind="transit",
                note="Allow at least 3 hours before international departure.",
                duration_min=90,
                lat=picked_hotel.lat if picked_hotel else None,
                lng=picked_hotel.lng if picked_hotel else None,
            ))
        elif not ordered:
            items.append(ItineraryDayItem(time="—", title="Free day · explore at your pace", kind="rest"))

        summary = (
            "Arrival day · settle in, evening stroll." if d == 0
            else "Departure day · last bites & souvenirs." if d == days - 1
            else f"{prefs.pace.title()} day · {len(ordered)} highlights."
        )
        out.append(ItineraryDay(
            day=d + 1, date=cur_date.isoformat(),
            summary=summary, items=items,
            hotel=picked_hotel if d < days - 1 else None,
        ))
    return out


def estimate_total(flights, hotels, nights: int) -> Optional[float]:
    if not flights and not hotels:
        return None
    cheapest_f = min((f.price_usd for f in flights), default=0)
    cheapest_h = min((h.price_usd for h in hotels), default=0)
    return round(cheapest_f + cheapest_h * max(1, nights), 2)
