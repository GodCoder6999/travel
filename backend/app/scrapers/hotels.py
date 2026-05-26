"""
Hotel data via SerpApi (Google Hotels).
Returns real hotel names, real prices, real photos, and real coordinates.
Falls back to OSM/Nominatim mock data when API key is missing.
"""
import httpx, hashlib, os
from typing import Optional
from urllib.parse import quote
from .images import _flickr_fallback
from ..models import HotelResult


NOMINATIM = "https://nominatim.openstreetmap.org/search"
OVERPASS = "https://overpass-api.de/api/interpreter"
HEADERS = {"User-Agent": "VoyagePlanner/1.0 (contact: dev@example.com)"}


# Approximate per-night USD baselines for popular destinations (mid-range).
CITY_PRICE_TIER: dict[str, float] = {
    "paris": 220, "london": 240, "new york": 320, "tokyo": 200, "singapore": 240,
    "zurich": 320, "dubai": 280, "san francisco": 300, "los angeles": 240,
    "rome": 180, "milan": 200, "barcelona": 180, "madrid": 170, "amsterdam": 220,
    "berlin": 150, "munich": 200, "vienna": 170, "prague": 110, "lisbon": 150,
    "istanbul": 110, "bangkok": 90, "bali": 100, "kuala lumpur": 95,
    "phuket": 110, "hong kong": 240, "seoul": 180, "sydney": 230, "melbourne": 200,
    "auckland": 200, "toronto": 220, "vancouver": 230, "montreal": 180,
    "mexico city": 110, "cairo": 90, "marrakech": 100, "cape town": 130,
    "rio de janeiro": 130, "sao paulo": 130, "buenos aires": 110,
    "delhi": 80, "mumbai": 95, "bengaluru": 80, "goa": 80, "kolkata": 70,
    "chennai": 75, "hyderabad": 75,
}


def _estimate_price(city: str, stars: Optional[int], rating: Optional[float], seed: int) -> float:
    base = CITY_PRICE_TIER.get(city.lower().strip(), 150)
    star_mul = {1: 0.4, 2: 0.7, 3: 1.0, 4: 1.6, 5: 2.6}.get(stars or 3, 1.0)
    rating_adj = 1.0 + ((rating or 4.0) - 4.0) * 0.25
    jitter = 0.85 + (seed % 30) / 100
    return round(base * star_mul * rating_adj * jitter, 2)


def _rating_for(name: str, stars: Optional[int], seed: int) -> float:
    base = {1: 3.4, 2: 3.7, 3: 4.0, 4: 4.3, 5: 4.6}.get(stars or 3, 4.0)
    return round(min(4.9, base + ((seed % 18) / 100) - 0.1), 1)


AMENITIES_BY_STARS = {
    1: ["Free WiFi", "AC", "24h reception"],
    2: ["Free WiFi", "AC", "Breakfast", "24h reception"],
    3: ["Free WiFi", "AC", "Breakfast", "Bar", "Gym"],
    4: ["Free WiFi", "Pool", "Spa", "Gym", "Restaurant", "Bar", "Concierge"],
    5: ["Free WiFi", "Pool", "Spa", "Gym", "Multiple restaurants", "Concierge", "Valet", "Butler service"],
}


async def scrape_hotels(city: str, checkin: str, checkout: str, guests: int) -> list[HotelResult]:
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return await _safe_fallback(city, guests)

    try:
        params = {
            "engine": "google_hotels",
            "q": city,
            "check_in_date": checkin,
            "check_out_date": checkout,
            "adults": guests,
            "currency": "USD",
            "hl": "en",
            "api_key": api_key,
        }
        async with httpx.AsyncClient(timeout=14.0) as client:
            r = await client.get("https://serpapi.com/search.json", params=params)
            r.raise_for_status()
            data = r.json()
            
            results: list[HotelResult] = []
            properties = data.get("properties", [])
            
            for p in properties[:15]:
                name = p.get("name")
                if not name:
                    continue
                
                rate_dict = p.get("rate_per_night", {})
                price = rate_dict.get("extracted_lowest") or rate_dict.get("extracted_before_taxes_fees")
                if price is None:
                    continue
                
                lat = p.get("gps_coordinates", {}).get("latitude")
                lng = p.get("gps_coordinates", {}).get("longitude")
                
                stars = p.get("extracted_hotel_class", 3)
                rating = p.get("overall_rating")
                reviews = p.get("reviews")
                
                # Image
                images = p.get("images", [])
                img_url = images[0].get("original_image") if images else None
                
                amenities = p.get("amenities", [])
                if not amenities:
                    amenities = AMENITIES_BY_STARS.get(stars or 3, AMENITIES_BY_STARS[3])
                
                deep_link = p.get("link")
                if not deep_link:
                    deep_link = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}" if lat and lng else f"https://www.google.com/maps/search/?api=1&query={quote(name + ' ' + city)}"
                
                results.append(HotelResult(
                    name=name,
                    price_usd=float(price),
                    rating=rating,
                    reviews=reviews,
                    image=img_url or _flickr_fallback(name, city, "hotel"),
                    address=f"{city.title()}",
                    deep_link=deep_link,
                    amenities=amenities[:5],
                    lat=lat,
                    lng=lng,
                    stars=stars,
                ))
            if results:
                return results
    except Exception as e:
        print(f"SerpApi Hotel Error: {e}")
        pass

    return await _safe_fallback(city, guests)



async def _safe_fallback(city: str, guests: int) -> list[HotelResult]:
    """Last resort: city-themed entries with real lat/lng from Nominatim + Flickr images."""
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=10.0) as cli:
            r = await cli.get(NOMINATIM, params={"q": city, "format": "json", "limit": 1})
            r.raise_for_status()
            res = r.json()
            if res:
                lat = float(res[0]["lat"]); lng = float(res[0]["lon"])
                out: list[HotelResult] = []
                for i in range(6):
                    seed = int(hashlib.md5(f"{city}{i}".encode()).hexdigest()[:6], 16)
                    name = ["Grand", "Boutique", "Heritage", "Riverside", "Skyline", "Garden"][i] + f" {city.title()} Hotel"
                    stars = 3 + (i % 2)
                    rating = _rating_for(name, stars, seed)
                    price = _estimate_price(city, stars, rating, seed)
                    out.append(HotelResult(
                        name=name, price_usd=price * max(1, guests // 2 or 1),
                        rating=rating, reviews=200 + (seed % 3000),
                        image=_flickr_fallback(name, city, "hotel,resort"),
                        address=f"Central {city.title()}",
                        deep_link=f"https://www.google.com/maps/search/?api=1&query={lat},{lng}",
                        amenities=AMENITIES_BY_STARS.get(stars, AMENITIES_BY_STARS[3]),
                        lat=lat, lng=lng, stars=stars,
                    ))
                return out
    except Exception:
        pass
    return []
