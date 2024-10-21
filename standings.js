const mongoose = require('mongoose');

// Define the schema for a team
const teamSchema = new mongoose.Schema({
  rank: String,
  team: String,
  wins: String,
  losses: String,
  winPercentage: String,
  gamesBehind: String,
  conferenceRecord: String,
  divisionRecord: String,
  homeRecord: String,
  awayRecord: String,
  otRecord: String,
  lastTen: String,
  streak: String,
  homeStreak: String, // Added for streak data
  roadStreak: String, // Added for streak data
  l10Home: String,    // Added for streak data
  l10Away: String,
  threePtGames: String,
  tenPtGames: String,
  score100: String,
  oppScore100: String,
  oppOver500: String,
  leadReb: String,
  fewTurn: String, 
  vsEast: String,
  vsWest: String,
  vsAtlantic: String,
  vsCentral: String,
  vsSoutheast:String,
  vsNorthwest: String,
  vsPacific:String,
  vsSouthwest: String,
  octRecord: String,
  novRecord: String,
  decRecord: String,
  janRecord: String,
  febRecord: String,
  marRecord: String,
  aprRecord: String,
});

// Define the schema for a conference
const conferenceSchema = new mongoose.Schema({
  name: String,
  teams: [teamSchema], // Array of teams
});

// Define the schema for the entire document
const standingsSchema = new mongoose.Schema({
  easternConference: conferenceSchema,
  westernConference: conferenceSchema,
});

// Create a model for the schema
const Standings = mongoose.model('Standings', standingsSchema);

module.exports = Standings;
