import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/scrape", async (req, res) => {
    const site = req.query.site;
    const fullPage = req.query.fullpage === "1"; // Ensure full page text extraction
    const waitTime = parseInt(req.query.wait) || 0; // Optional delay before scraping
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
        await page.setUserAgent(userAgent);
        await page.goto(`https://${site}`, { waitUntil: "networkidle2" });

        if (waitTime) await page.waitForTimeout(waitTime); // Wait if needed

        // ✅ Extract all text on the page, even from dynamically loaded content
        const content = await page.evaluate(() => {
            return document.body.innerText;
        });

        const pageTitle = await page.title();

        await browser.close();

        res.json({
            site: site,
            title: pageTitle,
            content: content.trim(), // Return full text from the page
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
