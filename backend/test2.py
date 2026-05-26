import asyncio
from app.main import plan

async def main():
    try:
        res = await plan({
            "origin": "CCU",
            "destination": "Paris",
            "depart": "2026-06-02",
            "ret": "2026-06-05",
            "pax": 2,
            "nationality": "IN"
        })
        print(res.dict())
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
