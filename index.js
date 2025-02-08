const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Puppeteer API is running! Use /scrape?site=example.com");
});

app.get("/scrape", async (req, res) => {
    const site = req.query.site;
    if (!site) {
        return res.status(400).json({ error: "Please provide a site URL in the query." });
    }

    try {
        const browser = await puppeteer.launch({
            headless: "new", // Use 'new' for better security
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.goto(`https://${site}`, { waitUntil: "domcontentloaded" });

        const pageTitle = await page.title();
        const content = await page.evaluate(() => document.body.innerText);

        await browser.close();

        res.json({
            site: site,
            title: pageTitle,
            content: content.substring(0, 500), // Limit to 500 chars
        });
    } catch (error) {
        console.error("Error scraping:", error);
        res.status(500).json({ error: "Failed to scrape site." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
