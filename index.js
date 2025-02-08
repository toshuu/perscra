import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/scrape", async (req, res) => {
    const site = req.query.site;
    const fullPage = req.query.fullpage === "1"; // If fullpage=1, get full page text
    const waitTime = parseInt(req.query.wait) || 0; // Delay before scraping
    const selector = req.query.selector; // Target specific part of the page
    const screenshot = req.query.screenshot === "1"; // Capture screenshot
    const userAgent = req.query.useragent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"; // Default user-agent

    if (!site) {
        return res.status(400).json({ error: "Please provide a site URL in the query." });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setUserAgent(userAgent); // Set custom user agent
        await page.goto(`https://${site}`, { waitUntil: "domcontentloaded" });

        if (waitTime) await page.waitForTimeout(waitTime); // Wait if needed

        let content;
        if (selector) {
            // If a selector is provided, scrape only that section
            content = await page.$eval(selector, (el) => el.innerText);
        } else {
            // Otherwise, scrape full page or only body text
            content = fullPage
                ? await page.evaluate(() => document.documentElement.innerText)
                : await page.evaluate(() => document.body.innerText);
        }

        const pageTitle = await page.title();
        let screenshotBuffer = null;

        if (screenshot) {
            screenshotBuffer = await page.screenshot({ encoding: "base64" });
        }

        await browser.close();

        res.json({
            site: site,
            title: pageTitle,
            content: content.substring(0, 5500), // Limit content for response
            screenshot: screenshotBuffer ? `data:image/png;base64,${screenshotBuffer}` : null, // Returns base64 screenshot
        });
    } catch (error) {
        console.error("Error scraping:", error);
        if (browser) await browser.close();
        res.status(500).json({ error: "Failed to scrape site." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
