const mongoose = require('mongoose');
const Standings = require('./standings');
require('dotenv').config();


const scraperObject = {
  url: 'https://www.nba.com/standings',
  async scraper(browser) {
    const mongoURL = process.env.MONGO_DB_CONNECTION; // Replace with your MongoDB server URL
    let data
    let page

    try {
       page = await browser.newPage();
      console.log(`Navigating to ${this.url}...`);
      await page.goto(this.url);
      await page.waitForSelector('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table');

       data = await page.evaluate(() => {
        const easternTeams = document.querySelectorAll('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
        const westernTeams = document.querySelectorAll('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
        const result = { easternConference: [], westernConference: [] };

        // Function to extract data from a row
        const extractData = (team) => {
          const tds = team.querySelectorAll('td'); // Select all td elements within the current tr
          const conferenceData = {};

          // Extract the team name and rank
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);

          if (match) {
            // If a match is found, set the rank and team name accordingly
            conferenceData.rank = match[1];
            conferenceData.team = match[2].trim();
          } else {
            // If no match is found, set the team name only
            conferenceData.team = teamNameWithRank;
          }

          // Assign values to other keys in the conferenceData object
          conferenceData.wins = tds[1].textContent.trim();
          conferenceData.losses = tds[2].textContent.trim();
          conferenceData.winPercentage = tds[3].textContent.trim();
          conferenceData.gamesBehind = tds[4].textContent.trim();
          conferenceData.conferenceRecord = tds[5].textContent.trim();
          conferenceData.divisionRecord = tds[6].textContent.trim();
          conferenceData.homeRecord = tds[7].textContent.trim();
          conferenceData.awayRecord = tds[8].textContent.trim();
          conferenceData.otRecord = tds[9].textContent.trim();
          conferenceData.lastTen = tds[10].textContent.trim();
          conferenceData.streak = tds[11].textContent.trim();

          return conferenceData;
        };

        // Extract data from each row in the Eastern Conference
        easternTeams.forEach((team) => {
          const easternConferenceData = extractData(team);
          result.easternConference.push(easternConferenceData);
        });

        // Extract data from each row in the Western Conference
        westernTeams.forEach((team) => {
          const westernConferenceData = extractData(team);
          result.westernConference.push(westernConferenceData);
        });

        return result;
      });

      // Connect to MongoDB
      await mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Connected to MongoDB');

      // Delete existing standings
      await Standings.deleteMany({});

      // Insert new standings
      await Standings.create({
        easternConference: {
          name: 'Eastern',
          teams: data.easternConference,
        },
        westernConference: {
          name: 'Western',
          teams: data.westernConference,
        },
      });

      console.log('Standings replaced in MongoDB');

    } catch (error) {
      console.error('Error during scraping:', error);
    } finally {
      // Disconnect from MongoDB after scraping
      await mongoose.disconnect();
      console.log('Connection to MongoDB closed');
    }

    return data;
  },
};

module.exports = scraperObject;
