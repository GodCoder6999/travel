"""
City + airport suggestions for search autocomplete.
- Airports: lazy-fetch full 28k IATA dataset (mwgg/Airports) on first call, cache in memory.
- Cities: Open-Meteo geocoding (live).
"""
import httpx, asyncio
from typing import Any, Optional

GEOCODE = "https://geocoding-api.open-meteo.com/v1/search"
AIRPORTS_JSON_URL = "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json"

HEADERS = {"User-Agent": "VoyagePlanner/1.0"}

# Embedded fallback — always queryable even during/before remote dataset load.
FALLBACK_AIRPORTS: list[dict] = [
    # North America
    {"iata": "JFK", "city": "New York", "name": "John F. Kennedy Intl", "country": "US"},
    {"iata": "LGA", "city": "New York", "name": "LaGuardia", "country": "US"},
    {"iata": "EWR", "city": "Newark", "name": "Newark Liberty", "country": "US"},
    {"iata": "LAX", "city": "Los Angeles", "name": "Los Angeles Intl", "country": "US"},
    {"iata": "SFO", "city": "San Francisco", "name": "San Francisco Intl", "country": "US"},
    {"iata": "ORD", "city": "Chicago", "name": "O'Hare Intl", "country": "US"},
    {"iata": "ATL", "city": "Atlanta", "name": "Hartsfield-Jackson", "country": "US"},
    {"iata": "MIA", "city": "Miami", "name": "Miami Intl", "country": "US"},
    {"iata": "BOS", "city": "Boston", "name": "Logan Intl", "country": "US"},
    {"iata": "SEA", "city": "Seattle", "name": "Seattle-Tacoma", "country": "US"},
    {"iata": "DEN", "city": "Denver", "name": "Denver Intl", "country": "US"},
    {"iata": "DFW", "city": "Dallas", "name": "Dallas/Fort Worth", "country": "US"},
    {"iata": "PHX", "city": "Phoenix", "name": "Sky Harbor Intl", "country": "US"},
    {"iata": "IAH", "city": "Houston", "name": "George Bush Intercontinental", "country": "US"},
    {"iata": "LAS", "city": "Las Vegas", "name": "Harry Reid Intl", "country": "US"},
    {"iata": "YYZ", "city": "Toronto", "name": "Pearson Intl", "country": "CA"},
    {"iata": "YVR", "city": "Vancouver", "name": "Vancouver Intl", "country": "CA"},
    {"iata": "YUL", "city": "Montreal", "name": "Trudeau", "country": "CA"},
    {"iata": "MEX", "city": "Mexico City", "name": "Benito Juárez", "country": "MX"},

    # Europe
    {"iata": "LHR", "city": "London", "name": "Heathrow", "country": "GB"},
    {"iata": "LGW", "city": "London", "name": "Gatwick", "country": "GB"},
    {"iata": "STN", "city": "London", "name": "Stansted", "country": "GB"},
    {"iata": "MAN", "city": "Manchester", "name": "Manchester", "country": "GB"},
    {"iata": "EDI", "city": "Edinburgh", "name": "Edinburgh", "country": "GB"},
    {"iata": "DUB", "city": "Dublin", "name": "Dublin", "country": "IE"},
    {"iata": "CDG", "city": "Paris", "name": "Charles de Gaulle", "country": "FR"},
    {"iata": "ORY", "city": "Paris", "name": "Orly", "country": "FR"},
    {"iata": "NCE", "city": "Nice", "name": "Côte d'Azur", "country": "FR"},
    {"iata": "FRA", "city": "Frankfurt", "name": "Frankfurt am Main", "country": "DE"},
    {"iata": "MUC", "city": "Munich", "name": "Munich", "country": "DE"},
    {"iata": "BER", "city": "Berlin", "name": "Brandenburg", "country": "DE"},
    {"iata": "AMS", "city": "Amsterdam", "name": "Schiphol", "country": "NL"},
    {"iata": "BCN", "city": "Barcelona", "name": "El Prat", "country": "ES"},
    {"iata": "MAD", "city": "Madrid", "name": "Barajas", "country": "ES"},
    {"iata": "FCO", "city": "Rome", "name": "Fiumicino", "country": "IT"},
    {"iata": "MXP", "city": "Milan", "name": "Malpensa", "country": "IT"},
    {"iata": "VCE", "city": "Venice", "name": "Marco Polo", "country": "IT"},
    {"iata": "ZRH", "city": "Zurich", "name": "Zurich", "country": "CH"},
    {"iata": "GVA", "city": "Geneva", "name": "Geneva", "country": "CH"},
    {"iata": "VIE", "city": "Vienna", "name": "Vienna Intl", "country": "AT"},
    {"iata": "CPH", "city": "Copenhagen", "name": "Kastrup", "country": "DK"},
    {"iata": "ARN", "city": "Stockholm", "name": "Arlanda", "country": "SE"},
    {"iata": "OSL", "city": "Oslo", "name": "Gardermoen", "country": "NO"},
    {"iata": "HEL", "city": "Helsinki", "name": "Vantaa", "country": "FI"},
    {"iata": "LIS", "city": "Lisbon", "name": "Humberto Delgado", "country": "PT"},
    {"iata": "ATH", "city": "Athens", "name": "Eleftherios Venizelos", "country": "GR"},
    {"iata": "IST", "city": "Istanbul", "name": "Istanbul", "country": "TR"},
    {"iata": "PRG", "city": "Prague", "name": "Václav Havel", "country": "CZ"},
    {"iata": "WAW", "city": "Warsaw", "name": "Chopin", "country": "PL"},
    {"iata": "BUD", "city": "Budapest", "name": "Ferenc Liszt", "country": "HU"},
    {"iata": "KEF", "city": "Reykjavík", "name": "Keflavík", "country": "IS"},

    # Middle East
    {"iata": "DXB", "city": "Dubai", "name": "Dubai Intl", "country": "AE"},
    {"iata": "AUH", "city": "Abu Dhabi", "name": "Abu Dhabi Intl", "country": "AE"},
    {"iata": "DOH", "city": "Doha", "name": "Hamad Intl", "country": "QA"},
    {"iata": "RUH", "city": "Riyadh", "name": "King Khalid", "country": "SA"},
    {"iata": "TLV", "city": "Tel Aviv", "name": "Ben Gurion", "country": "IL"},

    # Asia / Pacific
    {"iata": "HND", "city": "Tokyo", "name": "Haneda", "country": "JP"},
    {"iata": "NRT", "city": "Tokyo", "name": "Narita", "country": "JP"},
    {"iata": "KIX", "city": "Osaka", "name": "Kansai", "country": "JP"},
    {"iata": "ICN", "city": "Seoul", "name": "Incheon", "country": "KR"},
    {"iata": "PEK", "city": "Beijing", "name": "Capital", "country": "CN"},
    {"iata": "PVG", "city": "Shanghai", "name": "Pudong", "country": "CN"},
    {"iata": "HKG", "city": "Hong Kong", "name": "Chek Lap Kok", "country": "HK"},
    {"iata": "TPE", "city": "Taipei", "name": "Taoyuan", "country": "TW"},
    {"iata": "SIN", "city": "Singapore", "name": "Changi", "country": "SG"},
    {"iata": "BKK", "city": "Bangkok", "name": "Suvarnabhumi", "country": "TH"},
    {"iata": "DMK", "city": "Bangkok", "name": "Don Mueang", "country": "TH"},
    {"iata": "HKT", "city": "Phuket", "name": "Phuket Intl", "country": "TH"},
    {"iata": "KUL", "city": "Kuala Lumpur", "name": "KLIA", "country": "MY"},
    {"iata": "CGK", "city": "Jakarta", "name": "Soekarno-Hatta", "country": "ID"},
    {"iata": "DPS", "city": "Bali", "name": "Ngurah Rai", "country": "ID"},
    {"iata": "MNL", "city": "Manila", "name": "Ninoy Aquino", "country": "PH"},
    {"iata": "SGN", "city": "Ho Chi Minh City", "name": "Tan Son Nhat", "country": "VN"},
    {"iata": "HAN", "city": "Hanoi", "name": "Noi Bai", "country": "VN"},
    {"iata": "SYD", "city": "Sydney", "name": "Kingsford Smith", "country": "AU"},
    {"iata": "MEL", "city": "Melbourne", "name": "Tullamarine", "country": "AU"},
    {"iata": "BNE", "city": "Brisbane", "name": "Brisbane", "country": "AU"},
    {"iata": "PER", "city": "Perth", "name": "Perth", "country": "AU"},
    {"iata": "AKL", "city": "Auckland", "name": "Auckland", "country": "NZ"},

    # India
    {"iata": "DEL", "city": "Delhi", "name": "Indira Gandhi Intl", "country": "IN"},
    {"iata": "BOM", "city": "Mumbai", "name": "Chhatrapati Shivaji", "country": "IN"},
    {"iata": "BLR", "city": "Bengaluru", "name": "Kempegowda Intl", "country": "IN"},
    {"iata": "MAA", "city": "Chennai", "name": "Chennai Intl", "country": "IN"},
    {"iata": "CCU", "city": "Kolkata", "name": "Netaji Subhas Chandra Bose Intl", "country": "IN"},
    {"iata": "HYD", "city": "Hyderabad", "name": "Rajiv Gandhi Intl", "country": "IN"},
    {"iata": "GOI", "city": "Goa", "name": "Dabolim", "country": "IN"},
    {"iata": "AMD", "city": "Ahmedabad", "name": "Sardar Vallabhbhai Patel Intl", "country": "IN"},
    {"iata": "COK", "city": "Kochi", "name": "Cochin Intl", "country": "IN"},
    {"iata": "PNQ", "city": "Pune", "name": "Pune Intl", "country": "IN"},
    {"iata": "JAI", "city": "Jaipur", "name": "Jaipur Intl", "country": "IN"},
    {"iata": "LKO", "city": "Lucknow", "name": "Chaudhary Charan Singh Intl", "country": "IN"},
    {"iata": "TRV", "city": "Thiruvananthapuram", "name": "Trivandrum Intl", "country": "IN"},

    # Africa / S. America
    {"iata": "CAI", "city": "Cairo", "name": "Cairo Intl", "country": "EG"},
    {"iata": "JNB", "city": "Johannesburg", "name": "O.R. Tambo", "country": "ZA"},
    {"iata": "CPT", "city": "Cape Town", "name": "Cape Town Intl", "country": "ZA"},
    {"iata": "NBO", "city": "Nairobi", "name": "Jomo Kenyatta", "country": "KE"},
    {"iata": "RAK", "city": "Marrakech", "name": "Menara", "country": "MA"},
    {"iata": "CMN", "city": "Casablanca", "name": "Mohammed V", "country": "MA"},
    {"iata": "GRU", "city": "São Paulo", "name": "Guarulhos", "country": "BR"},
    {"iata": "GIG", "city": "Rio de Janeiro", "name": "Galeão", "country": "BR"},
    {"iata": "EZE", "city": "Buenos Aires", "name": "Ezeiza", "country": "AR"},
    {"iata": "LIM", "city": "Lima", "name": "Jorge Chávez", "country": "PE"},
    {"iata": "SCL", "city": "Santiago", "name": "Arturo Merino", "country": "CL"},
    {"iata": "BOG", "city": "Bogotá", "name": "El Dorado", "country": "CO"},
]

_state: dict[str, Any] = {"airports": None, "loading": False, "task": None}


def _get_pool() -> list[dict]:
    """Returns whatever pool is currently available (full if loaded, else fallback)."""
    return _state["airports"] or FALLBACK_AIRPORTS


async def _fetch_remote_airports() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=15.0, headers=HEADERS) as cli:
            r = await cli.get(AIRPORTS_JSON_URL)
            r.raise_for_status()
            raw = r.json()
        out: list[dict] = []
        for _icao, info in raw.items():
            iata = (info.get("iata") or "").strip().upper()
            if not iata or len(iata) != 3:
                continue
            name = (info.get("name") or "").strip()
            if not name:
                continue
            city = (info.get("city") or "").strip()
            country = (info.get("country") or "").strip()
            out.append({
                "iata": iata, "city": city or name, "name": name, "country": country,
                "lat": info.get("lat"), "lng": info.get("lon"),
            })
        return out
    except Exception:
        return []


async def _load_in_background() -> None:
    if _state["airports"] is not None or _state["loading"]:
        return
    _state["loading"] = True
    try:
        data = await _fetch_remote_airports()
        if data:
            # merge fallback IATA codes that weren't in remote (rare)
            existing = {a["iata"] for a in data}
            extra = [a for a in FALLBACK_AIRPORTS if a["iata"] not in existing]
            _state["airports"] = data + extra
    finally:
        _state["loading"] = False


def kick_off_load() -> None:
    """Fire-and-forget loader. Safe to call from startup or first request."""
    if _state["airports"] is not None or _state["loading"]:
        return
    try:
        loop = asyncio.get_running_loop()
        _state["task"] = loop.create_task(_load_in_background())
    except RuntimeError:
        pass


# Major hub set for ranking boosts.
HUBS = {
    "JFK", "LAX", "ORD", "ATL", "SFO", "DFW", "MIA", "BOS", "SEA", "DEN", "EWR", "LGA",
    "LHR", "LGW", "CDG", "ORY", "FRA", "MUC", "AMS", "MAD", "BCN", "FCO", "ZRH", "VIE", "CPH", "ARN",
    "DXB", "AUH", "DOH", "IST", "TLV",
    "HND", "NRT", "ICN", "PEK", "PVG", "HKG", "TPE", "SIN", "BKK", "KUL", "CGK",
    "SYD", "MEL", "AKL", "YYZ", "YVR", "MEX", "GRU", "EZE",
    "DEL", "BOM", "BLR", "CCU", "MAA", "HYD", "GOI", "AMD", "COK", "PNQ",
}


COUNTRY_HUBS: dict[str, str] = {
    # Americas
    "united states": "JFK", "usa": "JFK", "us": "JFK", "america": "JFK",
    "canada": "YYZ", "mexico": "MEX",
    "brazil": "GRU", "argentina": "EZE", "chile": "SCL", "peru": "LIM",
    "colombia": "BOG",
    # Europe
    "united kingdom": "LHR", "uk": "LHR", "great britain": "LHR",
    "england": "LHR", "scotland": "EDI", "ireland": "DUB",
    "france": "CDG", "germany": "FRA", "italy": "FCO", "spain": "MAD",
    "portugal": "LIS", "netherlands": "AMS", "belgium": "BRU",
    "switzerland": "ZRH", "austria": "VIE", "greece": "ATH",
    "czech republic": "PRG", "czechia": "PRG", "hungary": "BUD",
    "poland": "WAW", "denmark": "CPH", "sweden": "ARN", "norway": "OSL",
    "finland": "HEL", "iceland": "KEF", "russia": "SVO", "turkey": "IST",
    # Middle East / Africa
    "uae": "DXB", "united arab emirates": "DXB", "qatar": "DOH",
    "saudi arabia": "RUH", "israel": "TLV",
    "egypt": "CAI", "morocco": "CMN", "south africa": "JNB", "kenya": "NBO",
    # Asia / Pacific
    "japan": "HND", "south korea": "ICN", "korea": "ICN", "china": "PEK",
    "hong kong": "HKG", "taiwan": "TPE", "singapore": "SIN",
    "thailand": "BKK", "malaysia": "KUL", "vietnam": "SGN",
    "indonesia": "CGK", "philippines": "MNL",
    "india": "DEL", "bangladesh": "DAC", "nepal": "KTM", "sri lanka": "CMB",
    "australia": "SYD", "new zealand": "AKL",
}


def resolve_city_to_iata(query: str) -> Optional[str]:
    """
    Map a city / country / loose string to its primary IATA code.
    Strategy: exact match on city → hub preference; partial match falls back.
    Returns None if the string is too generic (e.g. a country name like 'United States').
    """
    if not query:
        return None
    q = query.strip()
    if len(q) == 3 and q.isalpha() and q.upper() in {a["iata"] for a in _get_pool()}:
        return q.upper()
    ql = q.lower()
    pool = _get_pool()

    exact_city: list[dict] = []
    starts_with: list[dict] = []
    contains: list[dict] = []
    for a in pool:
        city_l = (a.get("city") or "").lower()
        if not city_l:
            continue
        if city_l == ql:
            exact_city.append(a)
        elif city_l.startswith(ql) and len(ql) >= 3:
            starts_with.append(a)
        elif ql in city_l and len(ql) >= 4:
            contains.append(a)

    def pick_best(cands: list[dict]) -> Optional[str]:
        if not cands:
            return None
        cands.sort(key=lambda a: (0 if a["iata"] in HUBS else 1, a["iata"]))
        return cands[0]["iata"]

    hit = pick_best(exact_city) or pick_best(starts_with) or pick_best(contains)
    if hit:
        return hit

    # Country / region name fallback → primary hub.
    if ql in COUNTRY_HUBS:
        return COUNTRY_HUBS[ql]
    for country, hub in COUNTRY_HUBS.items():
        if ql.startswith(country) or country in ql:
            return hub
    return None


# Cache type for Optional import.
async def suggest_airports(q: str, limit: int = 12) -> list[dict]:
    if not q:
        return []
    ql = q.lower().strip()
    kick_off_load()
    pool = _get_pool()
    scored: list[tuple[int, dict]] = []
    for a in pool:
        iata_l = a["iata"].lower()
        city_l = a.get("city", "").lower()
        name_l = a.get("name", "").lower()
        country_l = a.get("country", "").lower()
        score = 0
        if iata_l == ql: score = 1000
        elif iata_l.startswith(ql) and len(ql) <= 3: score = 850
        elif city_l == ql: score = 800
        elif city_l.startswith(ql): score = 700
        elif name_l.startswith(ql): score = 500
        elif ql in city_l: score = 350
        elif ql in name_l: score = 250
        elif country_l.startswith(ql) and len(ql) == 2: score = 200
        if score and a["iata"] in HUBS:
            score += 80
        if score:
            scored.append((score, a))
    scored.sort(key=lambda t: -t[0])
    seen: set[str] = set()
    out: list[dict] = []
    for _, a in scored:
        if a["iata"] in seen:
            continue
        seen.add(a["iata"])
        out.append(a)
        if len(out) >= limit:
            break
    return out


async def suggest_cities(q: str, limit: int = 12) -> list[dict]:
    if not q or len(q) < 2:
        return []
    try:
        async with httpx.AsyncClient(timeout=8.0, headers=HEADERS) as cli:
            r = await cli.get(GEOCODE, params={"name": q, "count": limit, "language": "en"})
            r.raise_for_status()
            data = r.json().get("results", []) or []
            # Sort: exact prefix match > population
            ql = q.lower()
            def key(d):
                name = (d.get("name") or "").lower()
                pop = d.get("population") or 0
                prefix = 0 if name.startswith(ql) else 1
                return (prefix, -pop)
            data.sort(key=key)
            return [{
                "name": d.get("name"),
                "country": d.get("country_code") or d.get("country"),
                "admin1": d.get("admin1"),
                "lat": d.get("latitude"),
                "lng": d.get("longitude"),
                "population": d.get("population"),
            } for d in data]
    except Exception:
        return []
