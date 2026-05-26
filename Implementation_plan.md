Integrate Real-Time Travel APIs
Currently, the application relies on headless browser scraping (which often gets blocked) and fallback deterministic mock data to generate flights and OpenStreetMap for hotels (which lacks real pricing). To achieve real-time, production-grade data like MakeMyTrip, we need to integrate official third-party APIs.

User Review Required
WARNING

Transitioning to real-time APIs requires you to register for developer accounts and provide API keys. I cannot complete this implementation without valid API keys provided in a .env file in the backend directory.

Open Questions
IMPORTANT

Which API providers would you prefer to use? I recommend the following setup:

1. Flights & Hotels: SerpApi (Google Flights & Google Hotels APIs)

Why: It is the easiest drop-in replacement for our current scraper. It provides live, real-time Google Flights and Google Hotels data without requiring complex IATA certification or GDS integration.
Alternative: Amadeus for Developers (Industry standard, but requires OAuth2 integration and handles flight bookings more strictly).
2. High-Quality Images: Unsplash API & Google Places API

Why: Unsplash provides stunning, high-resolution destination images for free. Google Places API can provide accurate photos of specific hotels and attractions.
Please reply and confirm if you are comfortable registering for these API keys (SerpApi, Unsplash, Google Cloud), or if you have a different API provider in mind.

Proposed Changes
Backend Data Sources
[MODIFY] 
flights.py
Remove Playwright scraping logic and deterministic mock fallbacks.
Implement HTTP requests to SerpApi's Google Flights endpoint to fetch live flight itineraries, airlines, durations, and real-time USD pricing.
[MODIFY] 
hotels.py
Remove OpenStreetMap Overpass queries and deterministic price estimation.
Implement HTTP requests to SerpApi's Google Hotels endpoint (or Amadeus Hotel Search) to fetch real properties, live nightly rates, and verified ratings.
[MODIFY] 
images.py
Deprecate Wikipedia thumbnail scraping and loremflickr fallbacks.
Integrate the Unsplash API to fetch high-quality, relevant destination images based on the city and attraction names.
Optionally integrate Google Places API Photo endpoint for exact hotel building images.
[NEW] 
.env
Add necessary environment variables for the chosen providers (e.g., SERPAPI_KEY, UNSPLASH_ACCESS_KEY).
Dependencies
[MODIFY] 
requirements.txt
Remove playwright (as we will no longer need headless scraping).
Ensure httpx and python-dotenv are fully utilized for API calls and configuration.
Verification Plan
Automated Tests
Create a test script in the backend to directly query the new API scraper functions and ensure they return structured FlightResult and HotelResult models containing actual USD prices and valid image URLs.
Manual Verification
Restart the backend server with the newly provided .env variables.
Go through the Trip Wizard on the frontend and verify that the "Review" page and generated itinerary reflect live flight times, real hotel prices, and high-quality imagery.