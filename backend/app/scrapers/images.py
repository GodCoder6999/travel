"""
Real-image lookup helpers.

Strategy (priority order):
1. SerpApi Google Images — returns actual photos of the specific place/hotel/attraction.
2. Wikipedia REST summary endpoint — returns a thumbnail for places with articles.
3. Wikimedia Commons file query via OpenSearch — fallback for landmarks.
4. Loremflickr — deterministic Flickr photo matching a keyword tag (last resort).

Hotel images come directly from SerpApi Google Hotels (in hotels.py),
so this module is primarily used for attractions and destinations.
"""
import httpx, hashlib, asyncio, os
from typing import Optional
from urllib.parse import quote

WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/{q}"
WIKI_SEARCH = "https://en.wikipedia.org/w/api.php"
SERPAPI_URL = "https://serpapi.com/search.json"

HEADERS = {"User-Agent": "VoyagePlanner/1.0 (contact: dev@example.com)"}


def _upscale(thumb: str, target: int = 1000) -> str:
    """Wikimedia thumb URLs contain /<width>px- — bump to a bigger size."""
    if not thumb:
        return thumb
    import re
    return re.sub(r"/(\d{2,4})px-", f"/{target}px-", thumb, count=1)


async def _serpapi_image(client: httpx.AsyncClient, query: str) -> Optional[str]:
    """Use SerpApi Google Images to find a real photo of a specific place."""
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return None
    try:
        r = await client.get(
            SERPAPI_URL,
            params={
                "engine": "google_images",
                "q": query,
                "num": 1,
                "safe": "active",
                "api_key": api_key,
            },
            timeout=8.0,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        results = data.get("images_results", [])
        if results:
            return results[0].get("original") or results[0].get("thumbnail")
    except Exception as e:
        print(f"SerpApi Images Error: {e}")
    return None


async def _wiki_summary_image(client: httpx.AsyncClient, query: str) -> Optional[str]:
    try:
        r = await client.get(WIKI_SUMMARY.format(q=quote(query, safe="")), timeout=6.0)
        if r.status_code != 200:
            return None
        data = r.json()
        thumb = (data.get("thumbnail") or {}).get("source") or (data.get("originalimage") or {}).get("source")
        if not thumb:
            return None
        return _upscale(thumb, 1200)
    except Exception:
        return None


async def _wiki_search_image(client: httpx.AsyncClient, query: str) -> Optional[str]:
    """Use MediaWiki API to find a page with an image."""
    try:
        r = await client.get(
            WIKI_SEARCH,
            params={
                "action": "query", "format": "json", "prop": "pageimages",
                "piprop": "thumbnail", "pithumbsize": "1200",
                "generator": "search", "gsrsearch": query, "gsrlimit": 1,
                "redirects": 1,
            },
            timeout=6.0,
        )
        if r.status_code != 200:
            return None
        pages = (r.json().get("query") or {}).get("pages") or {}
        for _, p in pages.items():
            thumb = (p.get("thumbnail") or {}).get("source")
            if thumb:
                return _upscale(thumb, 1200)
    except Exception:
        pass
    return None


def _flickr_fallback(name: str, city: Optional[str], tag_hint: Optional[str]) -> str:
    parts = []
    if tag_hint: parts.append(tag_hint)
    if city: parts.append(city)
    parts.append("travel")
    tag = ",".join(quote(p.replace(" ", "")) for p in parts if p)
    lock = int(hashlib.md5(f"{name}|{city}".encode()).hexdigest()[:6], 16) % 9999
    return f"https://loremflickr.com/1200/800/{tag}?lock={lock}"


async def image_for(
    client: httpx.AsyncClient, name: str, city: Optional[str] = None,
    category: Optional[str] = None, kind_tag: str = "landmark",
) -> str:
    """
    Resolve a real image URL for a place.
    Priority: SerpApi Google Images → Wikipedia → Flickr fallback.
    """
    query = f"{name} {city or ''}".strip()

    # 1. Try SerpApi Google Images for the actual photo of this place
    img = await _serpapi_image(client, query)
    if img:
        return img

    # 2. Try Wikipedia summary / search
    queries: list[str] = []
    if city and name:
        queries.append(f"{name}, {city}")
    queries.append(name)
    if city and category:
        queries.append(f"{name} {category} {city}")

    for q in queries:
        img = await _wiki_summary_image(client, q)
        if img:
            return img

    for q in queries[:2]:
        img = await _wiki_search_image(client, q)
        if img:
            return img

    # 3. Last resort
    return _flickr_fallback(name, city, kind_tag)


async def resolve_images(
    items: list[tuple[str, Optional[str], Optional[str], str]],
    concurrency: int = 8,
) -> list[str]:
    """
    Resolve images for a batch in parallel.
    items: list of (name, city, category, kind_tag).
    """
    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(headers=HEADERS, timeout=8.0) as client:
        async def one(name, city, category, kind_tag):
            async with sem:
                try:
                    return await image_for(client, name, city, category, kind_tag)
                except Exception:
                    return _flickr_fallback(name, city, kind_tag)
        return await asyncio.gather(*(one(*it) for it in items))
