from pydantic import BaseModel, Field
from typing import Optional


class FlightQuery(BaseModel):
    origin: str
    destination: str
    depart: str
    ret: Optional[str] = None
    pax: int = 1


class HotelQuery(BaseModel):
    city: str
    checkin: str
    checkout: str
    guests: int = 2


class AttractionQuery(BaseModel):
    city: str
    limit: int = 20


class FlightResult(BaseModel):
    airline: str
    flight_no: Optional[str] = None
    depart_time: str
    arrive_time: str
    duration: str
    stops: int
    price_usd: float
    deep_link: Optional[str] = None
    origin: str
    destination: str
    airline_logo: Optional[str] = None
    cabin: Optional[str] = None
    is_sample: bool = False


class HotelResult(BaseModel):
    name: str
    rating: Optional[float] = None
    reviews: Optional[int] = None
    price_usd: float
    image: Optional[str] = None
    address: Optional[str] = None
    deep_link: Optional[str] = None
    amenities: list[str] = Field(default_factory=list)
    lat: Optional[float] = None
    lng: Optional[float] = None
    stars: Optional[int] = None


class AttractionResult(BaseModel):
    name: str
    rating: Optional[float] = None
    reviews: Optional[int] = None
    category: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class WeatherInfo(BaseModel):
    city: str
    date: Optional[str] = None
    temp_c: float
    temp_min_c: Optional[float] = None
    temp_max_c: Optional[float] = None
    condition: str
    humidity: Optional[int] = None
    wind_kph: Optional[float] = None
    icon: Optional[str] = None
    forecast: list[dict] = Field(default_factory=list)


class VisaInfo(BaseModel):
    nationality: str
    destination: str
    required: bool
    type: str
    duration_days: Optional[int] = None
    notes: Optional[str] = None


class Preferences(BaseModel):
    budget: str = "mid"          # low | mid | high | luxury
    vibe: list[str] = Field(default_factory=list)  # relax, adventure, culture, foodie, nightlife, family, romance
    pace: str = "balanced"       # chill | balanced | packed
    interests: list[str] = Field(default_factory=list)  # museums, parks, beaches, hiking, shopping, food, history, art
    nonstop_only: bool = False
    max_stops: int = 2
    accessible: bool = False
    sort_flights_by: str = "best"   # best | cheapest | fastest
    sort_hotels_by: str = "best"    # best | cheapest | top_rated


class ItineraryDayItem(BaseModel):
    time: str
    title: str
    kind: str           # attraction | meal | transit | rest | hotel
    note: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None
    rating: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    duration_min: Optional[int] = None


class ItineraryDay(BaseModel):
    day: int
    date: Optional[str] = None
    summary: str
    items: list[ItineraryDayItem] = Field(default_factory=list)
    hotel: Optional[HotelResult] = None


class TripPlan(BaseModel):
    flights: list[FlightResult] = Field(default_factory=list)
    hotels: list[HotelResult] = Field(default_factory=list)
    attractions: list[AttractionResult] = Field(default_factory=list)
    weather: Optional[WeatherInfo] = None
    visa: Optional[VisaInfo] = None
    itinerary: list[ItineraryDay] = Field(default_factory=list)
    preferences: Optional[Preferences] = None
    estimated_total_usd: Optional[float] = None
