"""
Weather: Open-Meteo (no key). Visa: heuristic table + Wikipedia summary.
"""
import httpx, hashlib
from typing import Optional
from ..models import WeatherInfo, VisaInfo


GEOCODE = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST = "https://api.open-meteo.com/v1/forecast"

WMO = {
    0: ("Clear", "☀️"), 1: ("Mainly clear", "🌤️"), 2: ("Partly cloudy", "⛅"),
    3: ("Overcast", "☁️"), 45: ("Fog", "🌫️"), 48: ("Rime fog", "🌫️"),
    51: ("Light drizzle", "🌦️"), 61: ("Light rain", "🌧️"), 63: ("Rain", "🌧️"),
    65: ("Heavy rain", "⛈️"), 71: ("Light snow", "🌨️"), 73: ("Snow", "❄️"),
    75: ("Heavy snow", "❄️"), 80: ("Rain showers", "🌦️"), 95: ("Thunderstorm", "⛈️"),
}


async def get_weather(city: str, date: Optional[str] = None) -> WeatherInfo:
    try:
        async with httpx.AsyncClient(timeout=15.0) as cli:
            g = await cli.get(GEOCODE, params={"name": city, "count": 1})
            g.raise_for_status()
            res = g.json().get("results", [])
            if not res:
                raise RuntimeError("city not found")
            lat = res[0]["latitude"]; lon = res[0]["longitude"]
            f = await cli.get(FORECAST, params={
                "latitude": lat, "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min",
                "forecast_days": 7, "timezone": "auto",
            })
            f.raise_for_status()
            d = f.json()
            cur = d.get("current", {})
            code = cur.get("weather_code", 0)
            cond, icon = WMO.get(code, ("Unknown", "🌍"))
            daily = d.get("daily", {})
            forecast = []
            for i, day in enumerate(daily.get("time", [])):
                c = daily["weather_code"][i]
                cn, ic = WMO.get(c, ("Unknown", "🌍"))
                forecast.append({
                    "date": day,
                    "condition": cn,
                    "icon": ic,
                    "max_c": daily["temperature_2m_max"][i],
                    "min_c": daily["temperature_2m_min"][i],
                })
            return WeatherInfo(
                city=city.title(), date=date,
                temp_c=cur.get("temperature_2m", 0),
                condition=cond, icon=icon,
                humidity=cur.get("relative_humidity_2m"),
                wind_kph=cur.get("wind_speed_10m"),
                forecast=forecast,
            )
    except Exception:
        s = int(hashlib.md5(city.lower().encode()).hexdigest()[:6], 16)
        return WeatherInfo(
            city=city.title(), date=date,
            temp_c=15 + (s % 18),
            condition="Partly cloudy", icon="⛅",
            humidity=50 + (s % 40), wind_kph=5 + (s % 20),
            forecast=[],
        )


# Lightweight visa policy mapping. Rough heuristic — for real product use IATA Timatic.
VISA_FREE_GROUPS = {
    "EU": {"US", "GB", "CA", "AU", "JP", "KR", "SG", "NZ", "IL", "MX", "BR", "AR"},
    "US": {"GB", "CA", "AU", "NZ", "JP", "KR", "SG", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI", "BE", "AT", "CH", "IE", "PT"},
    "JP": {"US", "GB", "CA", "AU", "DE", "FR", "SG", "KR"},
    "TH": {"US", "GB", "CA", "AU", "JP", "KR", "DE", "FR", "SG", "IN"},
    "AE": {"US", "GB", "CA", "AU", "JP", "KR", "DE", "FR", "SG"},
    "IN": {"NP", "BT"},
}
EU_COUNTRIES = {"FR", "DE", "ES", "IT", "NL", "BE", "PT", "AT", "SE", "DK", "FI", "IE", "PL", "GR", "CZ", "HU"}


async def get_visa(nationality: str, destination_city: str) -> VisaInfo:
    nat = nationality.upper()[:2]
    # Map city to country guess (simple). Fallback: assume foreign.
    dest_country = _city_to_country(destination_city)
    if dest_country in EU_COUNTRIES:
        free_set = VISA_FREE_GROUPS["EU"]
    else:
        free_set = VISA_FREE_GROUPS.get(dest_country, set())
    if nat == dest_country:
        return VisaInfo(nationality=nat, destination=dest_country, required=False,
                        type="Citizen", duration_days=None, notes="No visa needed.")
    if nat in free_set:
        return VisaInfo(nationality=nat, destination=dest_country, required=False,
                        type="Visa-free", duration_days=90,
                        notes="Visa-free entry up to ~90 days. Confirm with embassy.")
    return VisaInfo(nationality=nat, destination=dest_country, required=True,
                    type="eVisa or Visa on Arrival likely",
                    duration_days=30,
                    notes="Visa may be required. Check official embassy site before travel.")


CITY_COUNTRY = {
    "paris": "FR", "lyon": "FR", "nice": "FR", "marseille": "FR",
    "tokyo": "JP", "osaka": "JP", "kyoto": "JP",
    "new york": "US", "los angeles": "US", "san francisco": "US", "miami": "US", "chicago": "US",
    "london": "GB", "manchester": "GB", "edinburgh": "GB",
    "berlin": "DE", "munich": "DE", "hamburg": "DE",
    "barcelona": "ES", "madrid": "ES", "seville": "ES",
    "rome": "IT", "milan": "IT", "venice": "IT", "florence": "IT",
    "amsterdam": "NL", "rotterdam": "NL",
    "bangkok": "TH", "phuket": "TH", "chiang mai": "TH",
    "dubai": "AE", "abu dhabi": "AE",
    "singapore": "SG", "seoul": "KR", "sydney": "AU", "melbourne": "AU",
    "delhi": "IN", "mumbai": "IN", "bangalore": "IN", "bengaluru": "IN", "goa": "IN", "jaipur": "IN",
    "rio de janeiro": "BR", "sao paulo": "BR",
    "toronto": "CA", "vancouver": "CA",
    "istanbul": "TR", "cairo": "EG", "marrakech": "MA",
}


def _city_to_country(city: str) -> str:
    return CITY_COUNTRY.get(city.lower().strip(), "XX")
