# Voyage — 3D Travel Planner

A travel planning site with real-time web scrapers, Three.js 3D scroll effects, and a fully dynamic UI.

## Architecture

```
travel/
├── backend/          FastAPI + Playwright scrapers
│   └── app/
│       ├── main.py            REST API
│       ├── models.py          Pydantic schemas
│       └── scrapers/
│           ├── flights.py     Google Flights via Playwright (mock fallback)
│           ├── hotels.py      Booking.com via Playwright (mock fallback)
│           ├── attractions.py OpenStreetMap Overpass + Nominatim (real data, no key)
│           └── weather_visa.py Open-Meteo + visa heuristic
└── frontend/         Next.js 14 + R3F + Framer Motion + GSAP + Lenis
    ├── app/                   App router pages
    ├── components/
    │   ├── Hero.tsx           3D globe + scroll-locked title
    │   ├── Globe3D.tsx        Three.js earth + orbiting plane
    │   ├── Features.tsx       Cards that rotate in 3D on scroll
    │   ├── Parallax.tsx       Multi-layer parallax gallery
    │   ├── Marquee.tsx        Infinite city ticker
    │   ├── Planner.tsx        Search form + flights/hotels/attractions/weather/visa
    │   ├── Nav.tsx            Sticky shrinking nav
    │   ├── Footer.tsx
    │   └── SmoothScroll.tsx   Lenis smooth scroll provider
    └── lib/
        ├── api.ts             Typed API client
        └── cn.ts              Tailwind class merger
```

## Run

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
playwright install chromium     # downloads headless browser
uvicorn app.main:app --reload --port 8000
```

Backend at `http://localhost:8000`. Swagger UI at `/docs`.

### Frontend

```bash
cd frontend
copy .env.example .env.local    # optional
npm install
npm run dev
```

Open `http://localhost:3000`.

## API

| Endpoint | What |
|----------|------|
| `GET /api/flights?origin=JFK&destination=CDG&depart=2026-06-15&ret=2026-06-22&pax=2` | Flights |
| `GET /api/hotels?city=Paris&checkin=2026-06-15&checkout=2026-06-22&guests=2` | Hotels |
| `GET /api/attractions?city=Paris&limit=12` | Things to do |
| `GET /api/weather?city=Paris` | 7-day forecast |
| `GET /api/visa?nationality=US&destination=Paris` | Visa rules |
| `POST /api/plan` | Full itinerary (parallel scrape) |

All endpoints cache for 10 min in-process (TTLCache).

## Scrapers

- **Flights / Hotels**: Playwright Chromium with anti-detection (`navigator.webdriver=undefined`, random UA). Falls back to deterministic mock data if scrape blocked.
- **Attractions**: OpenStreetMap Nominatim + Overpass API — no API key, real tourist POIs within 8km.
- **Weather**: Open-Meteo — free, no key, hourly + 7-day daily forecast.
- **Visa**: Heuristic table mapping nationality → destination country. Replace with IATA Timatic for production.

## Frontend tricks

- **3D scroll hero**: globe rotates on `scrollY`, scales and offsets; airplane orbits with sin/cos.
- **Card rotateX on scroll**: `useScroll` + `useTransform` → cards tilt as they enter viewport.
- **Parallax gallery**: each image layer has its own `useTransform(speed)`.
- **Lenis smooth scroll**: eases native scroll for a buttery feel.
- **Sticky nav** that shrinks at 40px scroll.
- **Custom WebGL Earth**: procedural canvas texture (no external image needed).

## Notes

- Booking and Google Flights aggressively block scrapers. Mock fallback ensures the UI always renders meaningful data.
- For production, swap scrapers for partner APIs (Amadeus, Booking Affiliate, Google Places).
- Visa info is approximate — always confirm with the destination embassy.
