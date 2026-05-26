"""
FX rates from USD. Lightweight cache via Open ER (no key).
Static fallback ensures the API never blocks.
"""
import httpx, time

FX_URL = "https://open.er-api.com/v6/latest/USD"

# Approximate fallback rates per 1 USD (May 2025-ish baseline).
FALLBACK: dict[str, float] = {
    "USD": 1.0, "EUR": 0.92, "GBP": 0.78, "JPY": 156.0, "INR": 84.0,
    "AUD": 1.50, "CAD": 1.36, "AED": 3.67, "SGD": 1.34, "THB": 36.5,
    "BRL": 5.10, "CNY": 7.10, "KRW": 1350.0, "MXN": 18.5, "CHF": 0.90,
    "SEK": 10.6, "NOK": 10.7, "DKK": 6.85, "HKD": 7.80, "TRY": 32.0,
    "ZAR": 18.4, "NZD": 1.62, "PLN": 3.95,
}

_cache: dict = {"ts": 0, "rates": FALLBACK}
_TTL = 3600


async def get_rates() -> dict[str, float]:
    now = time.time()
    if now - _cache["ts"] < _TTL and _cache["rates"]:
        return _cache["rates"]
    try:
        async with httpx.AsyncClient(timeout=8.0) as cli:
            r = await cli.get(FX_URL)
            r.raise_for_status()
            data = r.json()
            if data.get("result") == "success":
                rates = {k: float(v) for k, v in data.get("rates", {}).items() if isinstance(v, (int, float))}
                # ensure USD present
                rates.setdefault("USD", 1.0)
                _cache.update(ts=now, rates=rates)
                return rates
    except Exception:
        pass
    _cache.update(ts=now)
    return _cache["rates"] or FALLBACK
