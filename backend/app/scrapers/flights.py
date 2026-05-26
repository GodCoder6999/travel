"""
Flight data via SerpApi (Google Flights).
Falls back to deterministic mock data when API key is missing.
"""
from typing import Optional
import hashlib, httpx, os
from ..models import FlightResult

async def scrape_flights(
    origin: str, destination: str, depart: str,
    ret: Optional[str], pax: int,
) -> list[FlightResult]:
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return _mock_flights(origin, destination, depart, ret, pax)

    try:
        params = {
            "engine": "google_flights",
            "departure_id": origin,
            "arrival_id": destination,
            "outbound_date": depart,
            "currency": "USD",
            "hl": "en",
            "api_key": api_key,
        }
        if ret:
            params["return_date"] = ret
            params["type"] = 1 # round trip
        else:
            params["type"] = 2 # one way

        async with httpx.AsyncClient(timeout=14.0) as client:
            r = await client.get("https://serpapi.com/search.json", params=params)
            r.raise_for_status()
            data = r.json()
            
            results: list[FlightResult] = []
            options = data.get("best_flights", []) + data.get("other_flights", [])
            
            for opt in options[:15]:
                price = opt.get("price")
                if price is None:
                    continue
                flights = opt.get("flights", [])
                if not flights:
                    continue

                first = flights[0]
                last = flights[-1]

                airline = first.get("airline", "Unknown")
                airline_logo = first.get("airline_logo") or opt.get("airline_logo")
                flight_no = first.get("flight_number")
                cabin = first.get("travel_class") or first.get("class")

                # Times are usually string like "2026-06-02 08:00"
                dep_t = first.get("departure_airport", {}).get("time", "")[-5:]
                arr_t = last.get("arrival_airport", {}).get("time", "")[-5:]

                dur_m = opt.get("total_duration", 0)
                dur_str = f"{dur_m // 60}h {dur_m % 60:02d}m" if dur_m else "—"

                stops = len(flights) - 1

                results.append(FlightResult(
                    airline=airline[:40],
                    flight_no=flight_no,
                    depart_time=dep_t or "—",
                    arrive_time=arr_t or "—",
                    duration=dur_str,
                    stops=stops,
                    price_usd=float(price) * pax,
                    origin=origin,
                    destination=destination,
                    deep_link=opt.get("booking_token_url") or f"https://www.google.com/travel/flights?q=from+{origin}+to+{destination}+{depart}",
                    airline_logo=airline_logo,
                    cabin=cabin,
                    is_sample=False,
                ))
            
            if results:
                results.sort(key=lambda x: x.price_usd)
                return results
    except Exception as e:
        print(f"SerpApi Flight Error: {e}")
        pass
    
    return _mock_flights(origin, destination, depart, ret, pax)


def _mock_flights(o: str, d: str, depart: str, ret: Optional[str], pax: int) -> list[FlightResult]:
    """
    Sample fare estimates shown when live flight data is unavailable.
    NOT real flights — no flight numbers, airlines marked as 'Sample'.
    Configure SERPAPI_KEY in backend/.env for live flight data.
    """
    seed = int(hashlib.md5(f"{o}{d}{depart}".encode()).hexdigest()[:8], 16)
    out: list[FlightResult] = []
    for i in range(6):
        s = (seed + i * 137) % 1000
        price = 220 + (s % 1100)
        h = 2 + (s % 14)
        m = (s * 7) % 60
        stops = 0 if i < 2 else 1 if i < 4 else 2
        dep_h = (6 + i * 2) % 24
        arr_h = (dep_h + h) % 24
        out.append(FlightResult(
            airline=f"Estimated fare · {stops} stop{'s' if stops != 1 else ''}",
            flight_no=None,
            depart_time=f"{dep_h:02d}:{(s*3)%60:02d}",
            arrive_time=f"{arr_h:02d}:{(s*11)%60:02d}",
            duration=f"{h}h {m:02d}m",
            stops=stops,
            price_usd=float(price * pax),
            origin=o, destination=d,
            deep_link=f"https://www.google.com/travel/flights?q=Flights+from+{o}+to+{d}+on+{depart}",
            is_sample=True,
        ))
    out.sort(key=lambda x: x.price_usd)
    return out
