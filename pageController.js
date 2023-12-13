const fs = require('fs');
const pageScraper = require('./pageScraper');

async function scrapeAll(browserInstance) {
  let browser;
  try {
    browser = await browserInstance;
    const scrapedData = await pageScraper.scraper(browser);

    // Save the scraped data as JSON in a file
    fs.writeFileSync("data.json", JSON.stringify({ teams: scrapedData }, null, 2));
    console.log("The data has been scraped and saved successfully!");
  } catch (err) {
    console.log("Could not resolve the browser instance => ", err);
  } finally {
    // Close the browser instance after the data is saved
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = scrapeAll;
