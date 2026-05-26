from contextlib import asynccontextmanager
from playwright.async_api import async_playwright
from fake_useragent import UserAgent

_ua = UserAgent()


@asynccontextmanager
async def browser_page(headless: bool = True):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=headless,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        ctx = await browser.new_context(
            user_agent=_ua.chrome,
            viewport={"width": 1366, "height": 900},
            locale="en-US",
        )
        page = await ctx.new_page()
        await page.add_init_script(
            "Object.defineProperty(navigator,'webdriver',{get:()=>undefined});"
        )
        try:
            yield page
        finally:
            await ctx.close()
            await browser.close()
