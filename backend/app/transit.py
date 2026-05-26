"""
Transit segment builder. Picks mode + duration + rough cost between two
geographic points using haversine distance + per-mode speed assumptions.
Currency is USD; frontend converts to user region.
"""
from math import radians, sin, cos, asin, sqrt
from typing import Optional, Tuple
from .models import ItineraryDayItem


def haversine_km(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    lat1, lng1 = a; lat2, lng2 = b
    R = 6371.0
    dlat = radians(lat2 - lat1); dlng = radians(lng2 - lng1)
    h = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * R * asin(sqrt(h))


# Per-mode: (avg km/h door-to-door, USD per km).
MODE_PROFILE: dict[str, Tuple[float, float]] = {
    "walk":   (4.5, 0.0),
    "metro":  (22.0, 0.20),     # incl. wait
    "taxi":   (28.0, 1.10),
    "drive":  (50.0, 0.35),     # rental + fuel amortized
    "train":  (90.0, 0.12),     # intercity rail
    "flight": (600.0, 0.18),    # door-to-door including airport time
}


def pick_mode(km: float) -> str:
    if km < 1.2:
        return "walk"
    if km < 6:
        return "metro"
    if km < 35:
        return "taxi"
    if km < 200:
        return "drive"
    if km < 900:
        return "train"
    return "flight"


def build_segment(
    from_pt: Tuple[Optional[float], Optional[float]],
    to_pt: Tuple[Optional[float], Optional[float]],
    target_time: str = "—",
) -> Optional[ItineraryDayItem]:
    flat, flng = from_pt; tlat, tlng = to_pt
    if flat is None or flng is None or tlat is None or tlng is None:
        return None
    km = haversine_km((flat, flng), (tlat, tlng))
    if km < 0.15:
        return None  # essentially same spot
    mode = pick_mode(km)
    speed, rate = MODE_PROFILE[mode]
    minutes = max(5, int(round((km / speed) * 60)))
    # Add fixed overheads (airport security, station wait).
    if mode == "flight":
        minutes += 120
    elif mode == "train":
        minutes += 20
    elif mode == "metro":
        minutes += 8
    cost = round(km * rate, 2) if rate else 0.0
    if mode == "flight":
        cost = max(cost, 80.0)  # min flight cost floor

    pretty = {
        "walk": ("Walk", "🚶"),
        "metro": ("Metro / public transit", "🚇"),
        "taxi": ("Taxi · ride-hail", "🚕"),
        "drive": ("Drive / rental car", "🚗"),
        "train": ("Train · intercity", "🚆"),
        "flight": ("Short flight", "✈️"),
    }[mode]
    label, emoji = pretty
    note_bits = [f"{km:.1f} km", f"~{minutes} min"]
    if cost > 0:
        note_bits.append(f"≈ ${cost:.0f}")
    return ItineraryDayItem(
        time=target_time,
        title=f"{emoji} {label}",
        kind="transit",
        note=" · ".join(note_bits),
        transit_mode=mode,
        transit_distance_km=round(km, 2),
        transit_cost_usd=cost,
        duration_min=minutes,
        from_lat=flat, from_lng=flng,
        lat=tlat, lng=tlng,
    )


def order_by_proximity(
    start: Tuple[Optional[float], Optional[float]],
    points: list[ItineraryDayItem],
) -> list[ItineraryDayItem]:
    """Greedy nearest-neighbor reorder so stops follow a sensible walking path."""
    if not points or start[0] is None:
        return points
    remaining = list(points)
    out: list[ItineraryDayItem] = []
    cur = start
    while remaining:
        best_i = 0; best_d = float("inf")
        for i, p in enumerate(remaining):
            if p.lat is None or p.lng is None:
                continue
            d = haversine_km(cur, (p.lat, p.lng))
            if d < best_d:
                best_d = d; best_i = i
        nxt = remaining.pop(best_i)
        out.append(nxt)
        if nxt.lat is not None and nxt.lng is not None:
            cur = (nxt.lat, nxt.lng)
    return out
