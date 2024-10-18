const mongoose = require('mongoose');
const Standings = require('./standings');
require('dotenv').config();

const scraperObject = {
  url: 'https://www.nba.com/standings',
  streaksUrl: 'https://www.nba.com/standings?Section=streaks',

  async scraper(browser) {
    const mongoURL = process.env.MONGO_DB_CONNECTION;
    let standingsData, streaksData;
    let page;

    try {
      // Scrape standings data
      page = await browser.newPage();
      console.log(`Navigating to ${this.url}...`);
      await page.goto(this.url);
      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table'
      );

      standingsData = await page.evaluate(() => {
        const easternTeams = document.querySelectorAll(
          '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table > tbody > tr'
        );
        const westernTeams = document.querySelectorAll(
          '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table > tbody > tr'
        );
        const result = { easternConference: [], westernConference: [] };

        const extractData = (team) => {
          const tds = team.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);

          if (match) {
            conferenceData.rank = match[1];
            conferenceData.team = match[2].split('-')[0].trim();
          }

          conferenceData.wins = tds[1].textContent.trim();
          conferenceData.losses = tds[2].textContent.trim();
          conferenceData.winPercentage = tds[3].textContent.trim();
          conferenceData.gamesBehind = tds[4].textContent.trim();
          conferenceData.conferenceRecord = tds[5].textContent.trim();
          conferenceData.divisionRecord = tds[6].textContent.trim();
          conferenceData.homeRecord = tds[7].textContent.trim();
          conferenceData.awayRecord = tds[8].textContent.trim();
          conferenceData.otRecord = tds[10].textContent.trim();
          conferenceData.lastTen = tds[11].textContent.trim();
          conferenceData.streak = tds[12].textContent.trim();

          return conferenceData;
        };

        easternTeams.forEach((team) => {
          result.easternConference.push(extractData(team));
        });

        westernTeams.forEach((team) => {
          result.westernConference.push(extractData(team));
        });

        return result;
      });

      // Scrape streaks data
      await page.goto(this.streaksUrl, { waitUntil: 'domcontentloaded' });

      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_withSubNav__ByKRF > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 10000 }
      );
      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_withSubNav__ByKRF > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 10000 }
      );

      await page.waitForTimeout(3000); // Delay to ensure content loads

      const easternTeams = await page.$$('#__next > div.Layout_base__6IeUC.Layout_withSubNav__ByKRF > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
      const easternStreaksData = await Promise.all(easternTeams.map(async (team) => {
        return await team.evaluate((teamRow) => {
          const tds = teamRow.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);

          if (match) {
            conferenceData.team = match[2].split('-')[0].trim();
          }

          conferenceData.homeStreak = tds[6].textContent.trim();
          conferenceData.roadStreak = tds[7].textContent.trim();
          conferenceData.l10Home = tds[8].textContent.trim();
          conferenceData.l10Away = tds[9].textContent.trim();

          return conferenceData;
        });
      }));

      const westernTeams = await page.$$('#__next > div.Layout_base__6IeUC.Layout_withSubNav__ByKRF > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
      const westernStreaksData = await Promise.all(westernTeams.map(async (team) => {
        return await team.evaluate((teamRow) => {
          const tds = teamRow.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);

          if (match) {
            conferenceData.team = match[2].split('-')[0].trim();
          }

          conferenceData.homeStreak = tds[6].textContent.trim();
          conferenceData.roadStreak = tds[7].textContent.trim();
          conferenceData.l10Home = tds[8].textContent.trim();
          conferenceData.l10Away = tds[9].textContent.trim();

          return conferenceData;
        });
      }));

      streaksData = {
        easternConference: easternStreaksData,
        westernConference: westernStreaksData,
      };

      // Function to merge streak data into the standings
      const mergeStreaksIntoStandings = (standings, streaks) => {
        standings.forEach((team) => {
          const streakTeam = streaks.find((streak) => streak.team === team.team);
          if (streakTeam) {
            Object.assign(team, streakTeam); // Merge streak data into the team object
          }
        });
      };

      // Merge the streak data into the standings data
      mergeStreaksIntoStandings(standingsData.easternConference, streaksData.easternConference);
      mergeStreaksIntoStandings(standingsData.westernConference, streaksData.westernConference);

      console.log('Merged standings with streak data:', standingsData);

      // Uncomment the MongoDB code when ready to save the data
      await mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Connected to MongoDB');

      await Standings.deleteMany({});
      await Standings.create({
        easternConference: {
          name: 'Eastern',
          teams: standingsData.easternConference,
        },
        westernConference: {
          name: 'Western',
          teams: standingsData.westernConference,
        },
      });

      console.log('Standings and streaks data saved to MongoDB');
    } catch (error) {
      console.error('Error during scraping:', error);
    } finally {
      await mongoose.disconnect();
      console.log('Connection to MongoDB closed');
    }

    return standingsData;
  },
};

module.exports = scraperObject
