const mongoose = require('mongoose');
const Standings = require('./standings');
require('dotenv').config();

const scraperObject = {
  url: 'https://www.nba.com/standings?Section=overall&Season=2024-25',
  streaksUrl: 'https://www.nba.com/standings?Section=streaks&Season=2024-25',
  marginsUrl:'https://www.nba.com/standings?Section=margins&Season=2024-25',
  confUrl:'https://www.nba.com/standings?Section=vs&Season=2024-25',
  calendarUrl:'https://www.nba.com/standings?Section=calendar&Season=2024-25',

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
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table', { visible: true, timeout: 60000 }
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
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 60000 }
      );
      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 60000 }
      );

      await page.waitForTimeout(3000); // Delay to ensure content loads

      const easternTeams = await page.$$('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
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

      const westernTeams = await page.$$('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
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

      // console.log('Merged standings with streak data:', standingsData);

      // Scrape margins data
      await page.goto(this.marginsUrl, { waitUntil: 'domcontentloaded' });

      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 60000 }
      );
      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 10000 }
      );

      await page.waitForTimeout(3000); // Delay to ensure content loads

      const easternTeamsMargins = await page.$$('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');

      const easternMarginsData = await Promise.all(easternTeamsMargins.map(async (team) => {
        const teamHandle = await team.evaluateHandle((teamRow) => teamRow);
        return await teamHandle.evaluate((teamRow) => {
          const tds = teamRow.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);
      
          if (match) {
            conferenceData.team = match[2].split('-')[0].trim();
          }
      
          conferenceData.threePtGames = tds[5].textContent.trim();
          conferenceData.tenPtGames = tds[6].textContent.trim();
          conferenceData.score100 = tds[7].textContent.trim();
          conferenceData.oppScore100 = tds[8].textContent.trim();
          conferenceData.oppOver500 = tds[9].textContent.trim();
          conferenceData.leadReb = tds[11].textContent.trim();
          conferenceData.fewTurn = tds[12].textContent.trim();
      
          return conferenceData;
        });
      }));
      

      console.log(easternMarginsData)

      const westernTeamsMargins = await page.$$('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
      const westernMarginsData = await Promise.all(westernTeamsMargins.map(async (team) => {
        const teamHandle = await team.evaluateHandle((teamRow) => teamRow);
        return await teamHandle.evaluate((teamRow) => {
          const tds = teamRow.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);

          if (match) {
            conferenceData.team = match[2].split('-')[0].trim();
          }

          conferenceData.threePtGames = tds[5].textContent.trim();
          conferenceData.tenPtGames = tds[6].textContent.trim();
          conferenceData.score100 = tds[7].textContent.trim();
          conferenceData.oppScore100 = tds[8].textContent.trim();
          conferenceData.oppOver500 = tds[9].textContent.trim();
          conferenceData.leadReb = tds[11].textContent.trim();
          conferenceData.fewTurn = tds[12].textContent.trim();

          return conferenceData;
        });
      }));
      console.log(westernMarginsData)

      marginsData = {
        easternConference: easternMarginsData,
        westernConference: westernMarginsData,
      };

      const mergeMarginsIntoStandings = (standings, margins) => {
        standings.forEach((team) => {
          const marginsTeam = margins.find((margin) => margin.team === team.team);
          if (marginsTeam) {
            Object.assign(team, marginsTeam); // Merge streak data into the team object
          }
        });
      };

      // Merge the streak data into the standings data
      mergeMarginsIntoStandings(standingsData.easternConference, marginsData.easternConference);
      mergeMarginsIntoStandings(standingsData.westernConference, marginsData.westernConference);

      // console.log("merged margins into standings data", standingsData)

      // Scrape conf data
      await page.goto(this.confUrl, { waitUntil: 'domcontentloaded' });

      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 10000 }
      );
      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 10000 }
      );

      await page.waitForTimeout(3000); // Delay to ensure content loads

      const easternTeamsConf = await page.$$('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');

      const easternConfData = await Promise.all(easternTeamsConf.map(async (team) => {
        const teamHandle = await team.evaluateHandle((teamRow) => teamRow);
        return await teamHandle.evaluate((teamRow) => {
          const tds = teamRow.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);
      
          if (match) {
            conferenceData.team = match[2].split('-')[0].trim();
          }
      
          conferenceData.vsEast = tds[5].textContent.trim();
          conferenceData.vsWest = tds[6].textContent.trim();
          conferenceData.vsAtlantic = tds[7].textContent.trim();
          conferenceData.vsCentral = tds[8].textContent.trim();
          conferenceData.vsSoutheast = tds[9].textContent.trim();
          conferenceData.vsNorthwest = tds[10].textContent.trim();
          conferenceData.vsPacific = tds[11].textContent.trim();
          conferenceData.vsSouthwest = tds[12].textContent.trim();
      
          return conferenceData;
        });
      }));
      

   

      const westernTeamsConf = await page.$$('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
      const westernConfData = await Promise.all(westernTeamsConf.map(async (team) => {
        const teamHandle = await team.evaluateHandle((teamRow) => teamRow);
        return await teamHandle.evaluate((teamRow) => {
          const tds = teamRow.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);

          if (match) {
            conferenceData.team = match[2].split('-')[0].trim();
          }

          conferenceData.vsEast = tds[5].textContent.trim();
          conferenceData.vsWest = tds[6].textContent.trim();
          conferenceData.vsAtlantic = tds[7].textContent.trim();
          conferenceData.vsCentral = tds[8].textContent.trim();
          conferenceData.vsSoutheast = tds[9].textContent.trim();
          conferenceData.vsNorthwest = tds[10].textContent.trim();
          conferenceData.vsPacific = tds[11].textContent.trim();
          conferenceData.vsSouthwest = tds[12].textContent.trim();

          return conferenceData;
        });
      }));
    

      confData = {
        easternConference: easternConfData,
        westernConference: westernConfData,
      };

      const mergeConfIntoStandings = (standings, conf) => {
        standings.forEach((team) => {
          const confTeam = conf.find((conf) => conf.team === team.team);
          if (confTeam) {
            Object.assign(team, confTeam); // Merge streak data into the team object
          }
        });
      };

      // // Merge the conf data into the standings data
      mergeConfIntoStandings(standingsData.easternConference, confData.easternConference);
      mergeConfIntoStandings(standingsData.westernConference, confData.westernConference);

     

      // Scrape Calandar data
      await page.goto(this.calendarUrl, { waitUntil: 'domcontentloaded' });

      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 10000 }
      );
      await page.waitForSelector(
        '#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table',
        { visible: true, timeout: 10000 }
      );

      await page.waitForTimeout(3000); // Delay to ensure content loads

      const easternTeamsCalendar = await page.$$('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(2) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');

      const easternCalendarData = await Promise.all(easternTeamsCalendar.map(async (team) => {
        const teamHandle = await team.evaluateHandle((teamRow) => teamRow);
        return await teamHandle.evaluate((teamRow) => {
          const tds = teamRow.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);
      
          if (match) {
            conferenceData.team = match[2].split('-')[0].trim();
          }
      
          conferenceData.octRecord = tds[5].textContent.trim();
          conferenceData.novRecord = tds[6].textContent.trim();
          conferenceData.decRecord= tds[7].textContent.trim();
          conferenceData.janRecord = tds[8].textContent.trim();
          conferenceData.febRecord = tds[9].textContent.trim();
          conferenceData.marRecord = tds[10].textContent.trim();
          conferenceData.aprRecord = tds[11].textContent.trim();
      
          return conferenceData;
        });
      }));
      

    

      const westernTeamsCalendar = await page.$$('#__next > div.Layout_base__6IeUC.Layout_justNav__2H4H0 > div.Layout_mainContent__jXliI > div.MaxWidthContainer_mwc__ID5AG > section.Block_block__62M07.nba-stats-content-block > div > div:nth-child(3) > div.Crom_container__C45Ti.crom-container > table > tbody > tr');
      const westernCalendarData = await Promise.all(westernTeamsCalendar.map(async (team) => {
        const teamHandle = await team.evaluateHandle((teamRow) => teamRow);
        return await teamHandle.evaluate((teamRow) => {
          const tds = teamRow.querySelectorAll('td');
          const conferenceData = {};
          const teamNameWithRank = tds[0].textContent.trim();
          const match = teamNameWithRank.match(/^(\d+)(.+)/);

          if (match) {
            conferenceData.team = match[2].split('-')[0].trim();
          }

          conferenceData.octRecord = tds[5].textContent.trim();
          conferenceData.novRecord = tds[6].textContent.trim();
          conferenceData.decRecord= tds[7].textContent.trim();
          conferenceData.janRecord = tds[8].textContent.trim();
          conferenceData.febRecord = tds[9].textContent.trim();
          conferenceData.marRecord = tds[10].textContent.trim();
          conferenceData.aprRecord = tds[11].textContent.trim();

          return conferenceData;
        });
      }));
    

      calendarData = {
        easternConference: easternCalendarData,
        westernConference: westernCalendarData,
      };

      const mergeCalendarIntoStandings = (standings, calendar) => {
        standings.forEach((team) => {
          const calendarTeam = calendar.find((cal) => cal.team === team.team);
          if (calendarTeam) {
            Object.assign(team, calendarTeam); // Merge streak data into the team object
          }
        });
      };

      // // // Merge the cal data into the standings data
      mergeCalendarIntoStandings(standingsData.easternConference, calendarData.easternConference);
      mergeCalendarIntoStandings(standingsData.westernConference, calendarData.westernConference);

      console.log("merged cal recrods into standings data", standingsData)

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
