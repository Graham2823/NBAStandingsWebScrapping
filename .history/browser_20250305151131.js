const puppeteer = require('puppeteer');

async function startBrowser(){
	let browser;
	try {
	    console.log("Opening the browser......");
	    browser = await puppeteer.launch({
	        headless: "new",  // Ensures it runs properly in GitHub Actions
	        args: [
	            "--no-sandbox",
	            "--disable-setuid-sandbox",
	            "--disable-gpu", // Prevents GPU-related crashes
	            "--disable-dev-shm-usage" // Reduces RAM issues in CI environments
	        ],
	        ignoreHTTPSErrors: true
	    });
	} catch (err) {
	    console.log("Could not create a browser instance => : ", err);
	}
	return browser;
}

module.exports = {
	startBrowser
};
